import { createServerClient } from "@supabase/ssr";
import { getSession, updateSessionTokens, revokeSession, touchSession } from "./session";

export class BridgeSessionError extends Error {
  constructor(public readonly reason: "reauth_required" | "not_found") {
    super(`Bridge session error: ${reason}`);
    this.name = "BridgeSessionError";
  }
}

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return url.replace(/\/$/, "");
}

async function refreshTokens(sessionId: string, refreshToken: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase configuration");
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    await revokeSession(sessionId, "").catch(() => {});
    // Mark as reauth_required via a targeted update
    const { getSupabaseAdminClient } = await import("@/lib/db/server");
    await getSupabaseAdminClient()
      .from("chat_sessions")
      .update({ status: "reauth_required" })
      .eq("session_id", sessionId);
    throw new BridgeSessionError("reauth_required");
  }

  const { access_token, refresh_token, expires_at } = data.session;
  const expiresAt = expires_at ? new Date(expires_at * 1000) : new Date(Date.now() + 3600_000);
  await updateSessionTokens(sessionId, access_token, refresh_token, expiresAt);

  return access_token;
}

/**
 * Executes an authenticated fetch to an internal API path using the
 * bearer token stored in the given bridge session. Handles token refresh
 * and a single retry on 401. Fire-and-forgets `touchSession` on success.
 */
export async function bridgeApiFetch(
  sessionId: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const session = await getSession(sessionId);

  if (!session || session.status === "revoked") {
    throw new BridgeSessionError("not_found");
  }

  if (session.status === "reauth_required") {
    throw new BridgeSessionError("reauth_required");
  }

  const appUrl = getAppUrl();
  const url = `${appUrl}${path}`;

  // Proactively refresh if token expires within 60 seconds
  let { accessToken } = session;
  if (session.accessExpiresAt.getTime() < Date.now() + 60_000) {
    accessToken = await refreshTokens(sessionId, session.refreshToken);
  }

  const makeRequest = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await makeRequest(accessToken);

  // On 401, attempt one token refresh and retry
  if (response.status === 401) {
    try {
      accessToken = await refreshTokens(sessionId, session.refreshToken);
    } catch {
      throw new BridgeSessionError("reauth_required");
    }
    response = await makeRequest(accessToken);
    if (response.status === 401) {
      const { getSupabaseAdminClient } = await import("@/lib/db/server");
      await getSupabaseAdminClient()
        .from("chat_sessions")
        .update({ status: "reauth_required" })
        .eq("session_id", sessionId);
      throw new BridgeSessionError("reauth_required");
    }
  }

  // Fire-and-forget touch
  touchSession(sessionId).catch(() => {});

  return response;
}
