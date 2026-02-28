import {
  badRequest,
  internalError,
  ok,
} from "@/lib/api/http";
import { isExecutionStatus } from "@/lib/api/execution";
import { parseLimit } from "@/lib/api/requests";
import { getSupabaseAdminClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sender = url.searchParams.get("sender")?.trim() ?? null;
  const receiver = url.searchParams.get("receiver")?.trim() ?? null;
  const user = url.searchParams.get("user")?.trim() ?? null;
  const status = url.searchParams.get("status")?.trim() ?? null;
  const limit = parseLimit(url.searchParams.get("limit"));

  if (!sender && !receiver && !user) {
    return badRequest("sender, receiver, or user is required.");
  }

  if (status && !isExecutionStatus(status)) {
    return badRequest("status must be one of: pending, success, failure.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("private_transactions")
      .select("uid, sender, receiver, ciphertext, nonce, sender_pubkey_used, ts, status")
      .order("ts", { ascending: false })
      .limit(limit);

    if (sender) {
      query = query.eq("sender", sender);
    }

    if (receiver) {
      query = query.eq("receiver", receiver);
    }

    if (user) {
      query = query.or(`sender.eq.${user},receiver.eq.${user}`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return internalError(error.message);
    }

    return ok({
      privateTransactions: (data ?? []).map((row) => ({
        uid: row.uid,
        sender: row.sender,
        receiver: row.receiver,
        ciphertext: row.ciphertext,
        nonce: row.nonce,
        senderPublicKeyUsed: row.sender_pubkey_used,
        timestamp: row.ts,
        status: row.status,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
