import { badRequest, forbidden, internalError, ok, parseJsonBody, unauthorized } from "@/lib/api/http";
import { buildPrivateExecutionRequest } from "@/lib/api/execution";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const bodyResult = await parseJsonBody(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const { data, error } = buildPrivateExecutionRequest(
    body as Parameters<typeof buildPrivateExecutionRequest>[0],
  );

  if (error || !data) {
    return badRequest(error ?? "Invalid private execute payload.");
  }

  if (user.id !== data.sender) return forbidden("Access denied.");

  try {
    const supabase = getSupabaseAdminClient();

    const { data: row, error: insertError } = await supabase
      .from("private_transactions")
      .insert({
        sender: data.sender,
        receiver: data.receiver,
        ciphertext: data.ciphertext,
        nonce: data.nonce,
        sender_pubkey_used: data.senderPublicKeyUsed,
        status: data.status,
      })
      .select("uid, ts, status, sender, receiver")
      .single();

    if (insertError) {
      return internalError(insertError.message);
    }

    return ok({
      uid: row.uid,
      time: row.ts,
      status: row.status,
      sender: row.sender,
      receiver: row.receiver,
      type: "private",
    });
  } catch (error) {
    return internalError(error);
  }
}
