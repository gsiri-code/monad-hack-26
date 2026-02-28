import {
  badRequest,
  internalError,
  notFound,
  ok,
} from "@/lib/api/http";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { uid } = await params;
  const user = new URL(request.url).searchParams.get("user")?.trim() ?? null;

  if (!uid) {
    return badRequest("uid is required.");
  }

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

    return ok({
      uid: data.uid,
      sender: data.sender,
      receiver: data.receiver,
      ciphertext: data.ciphertext,
      nonce: data.nonce,
      senderPublicKeyUsed: data.sender_pubkey_used,
      timestamp: data.ts,
      status: data.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
