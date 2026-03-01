import { getSupabaseAdminClient } from "@/lib/db/server";
import { encrypt, decrypt } from "./crypto";

export interface SessionData {
  userUid: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  status: "active" | "reauth_required" | "revoked";
}

export async function createSession(
  userUid: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_uid: userUid,
      access_token_encrypted: encrypt(accessToken),
      refresh_token_encrypted: encrypt(refreshToken),
      access_expires_at: expiresAt.toISOString(),
    })
    .select("session_id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create chat session: ${error?.message}`);
  }

  return data.session_id as string;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("user_uid, access_token_encrypted, refresh_token_encrypted, access_expires_at, status")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return null;

  return {
    userUid: data.user_uid,
    accessToken: decrypt(data.access_token_encrypted),
    refreshToken: decrypt(data.refresh_token_encrypted),
    accessExpiresAt: new Date(data.access_expires_at),
    status: data.status as SessionData["status"],
  };
}

export async function updateSessionTokens(
  sessionId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({
      access_token_encrypted: encrypt(accessToken),
      refresh_token_encrypted: encrypt(refreshToken),
      access_expires_at: expiresAt.toISOString(),
      status: "active",
    })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to update session tokens: ${error.message}`);
  }
}

export async function revokeSession(sessionId: string, userUid: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({ status: "revoked" })
    .eq("session_id", sessionId)
    .eq("user_uid", userUid);

  if (error) {
    throw new Error(`Failed to revoke session: ${error.message}`);
  }
}

export async function touchSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  // Fire-and-forget: ignore errors intentionally
  await supabase
    .from("chat_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("session_id", sessionId);
}
