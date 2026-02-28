import {
  badRequest,
  internalError,
  ok,
  unauthorized,
} from "@/lib/api/http";
import {
  isExecutionStatus,
  toPrivateTxResponse,
  type PrivateTransactionRow,
} from "@/lib/api/execution";
import { parseLimit } from "@/lib/api/requests";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const sender = url.searchParams.get("sender")?.trim() ?? null;
  const receiver = url.searchParams.get("receiver")?.trim() ?? null;
  const status = url.searchParams.get("status")?.trim() ?? null;
  const limit = parseLimit(url.searchParams.get("limit"));

  if (status && !isExecutionStatus(status)) {
    return badRequest("status must be one of: pending, success, failure.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("private_transactions")
      .select("uid, sender, receiver, ciphertext, nonce, sender_pubkey_used, ts, status")
      .order("ts", { ascending: false })
      .limit(limit)
      .or(`sender.eq.${user.id},receiver.eq.${user.id}`);

    if (sender) {
      query = query.eq("sender", sender);
    }

    if (receiver) {
      query = query.eq("receiver", receiver);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return internalError(error.message);
    }

    return ok({
      privateTransactions: (data ?? []).map((row) =>
        toPrivateTxResponse(row as PrivateTransactionRow),
      ),
    });
  } catch (error) {
    return internalError(error);
  }
}
