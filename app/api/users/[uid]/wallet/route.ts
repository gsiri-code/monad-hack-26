import { forbidden, internalError, ok, requireUid, unauthorized } from "@/lib/api/http";
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

  if (user.id !== uid) return forbidden("Access denied.");

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
    return internalError(error);
  }
}
