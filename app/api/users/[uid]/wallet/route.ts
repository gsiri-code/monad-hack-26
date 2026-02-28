import { badRequest, internalError, ok } from "@/lib/api/http";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { uid } = await params;

  if (!uid) {
    return badRequest("uid is required.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: incomingRows, error: incomingError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("receiver", uid)
      .eq("status", "success");

    if (incomingError) {
      return internalError(incomingError.message);
    }

    const { data: outgoingRows, error: outgoingError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("sender", uid)
      .eq("status", "success");

    if (outgoingError) {
      return internalError(outgoingError.message);
    }

    const incoming = incomingRows.reduce(
      (total, row) => total + Number(row.amount),
      0,
    );
    const outgoing = outgoingRows.reduce(
      (total, row) => total + Number(row.amount),
      0,
    );

    const netBalance = (incoming - outgoing).toString();

    return ok({
      uid,
      wallet: [{ currencyName: "MON", amount: netBalance }],
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : undefined;
    return internalError(messageText);
  }
}
