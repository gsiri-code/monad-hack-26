import {
  forbidden,
  internalError,
  notFound,
  ok,
  requireUid,
  unauthorized,
} from "@/lib/api/http";
import {
  toPrivateTxResponse,
  type PrivateTransactionRow,
} from "@/lib/api/execution";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const uidResult = requireUid((await params).uid);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("private_transactions")
      .select("uid, sender, receiver, ciphertext, nonce, sender_pubkey_used, ts, status")
      .eq("uid", uid)
      .maybeSingle();

    if (error) {
      return internalError(error.message);
    }

    if (!data) {
      return notFound("private transaction not found.");
    }

    const row = data as PrivateTransactionRow;
    if (row.sender !== user.id && row.receiver !== user.id) {
      return forbidden("Access denied.");
    }

    return ok(toPrivateTxResponse(row));
  } catch (error) {
    return internalError(error);
  }
}
