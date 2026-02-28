import {
  internalError,
  notFound,
  ok,
  requireUid,
} from "@/lib/api/http";
import {
  toPrivateTxResponse,
  type PrivateTransactionRow,
} from "@/lib/api/execution";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const uidResult = requireUid((await params).uid);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  const user = new URL(request.url).searchParams.get("user")?.trim() ?? null;

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

    if (user && data.sender !== user && data.receiver !== user) {
      return notFound("private transaction not found.");
    }

    return ok(toPrivateTxResponse(data as PrivateTransactionRow));
  } catch (error) {
    return internalError(error);
  }
}
