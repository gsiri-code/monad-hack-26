import { bridgeApiFetch, BridgeSessionError } from "@/lib/bridge/api-client";
import { getSupabaseAdminClient } from "@/lib/db/server";
import { createServerClient } from "@supabase/ssr";

/** DEV ONLY — generates a token for a given email without sending an email */
export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  const admin = getSupabaseAdminClient();

  // Generate a magic link and extract the token from the action_link URL
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data.properties?.action_link) {
    return Response.json({ error: error?.message ?? "generateLink failed" }, { status: 500 });
  }

  // The action_link is e.g. https://<project>.supabase.co/auth/v1/verify?token=...&type=magiclink
  const actionUrl = new URL(data.properties.action_link);
  const token = actionUrl.searchParams.get("token");
  const type = actionUrl.searchParams.get("type");

  if (!token) {
    return Response.json({ error: "no token in action_link" }, { status: 500 });
  }

  // Exchange the OTP for a real session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: (type as "magiclink") ?? "magiclink",
  });

  if (verifyError || !verifyData.session) {
    return Response.json({ error: verifyError?.message ?? "verifyOtp failed" }, { status: 500 });
  }

  return Response.json({
    accessToken: verifyData.session.access_token,
    refreshToken: verifyData.session.refresh_token,
    expiresAt: verifyData.session.expires_at,
    userId: verifyData.user?.id,
  });
}

/** Test bridgeApiFetch with a sessionId */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  try {
    const res = await bridgeApiFetch(sessionId, "/api/auth/me");
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    const reason = err instanceof BridgeSessionError ? err.reason : String(err);
    return Response.json({ error: reason }, { status: 401 });
  }
}
