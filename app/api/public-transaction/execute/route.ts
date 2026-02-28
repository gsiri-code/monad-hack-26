import { badRequest, internalError, ok } from "@/lib/api/http";
import { buildPublicExecutionRequest } from "@/lib/api/execution";
import { getSupabaseAdminClient } from "@/lib/db/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const { data, error } = buildPublicExecutionRequest(
    body as Parameters<typeof buildPublicExecutionRequest>[0],
  );

  if (error || !data) {
    return badRequest(error ?? "Invalid execute payload.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: row, error: insertError } = await supabase
      .from("transactions")
      .insert({
        sender: data.sender,
        receiver: data.receiver,
        amount: data.amount,
        status: data.status,
        message: data.message,
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
      type: "public",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
