import { badRequest, created, internalError, ok, parseJsonBody } from "@/lib/api/http";
import {
  isRequestStatus,
  parseLimit,
  parsePositiveAmount,
  toRequestResponse,
  type RequestRow,
} from "@/lib/api/requests";
import { getSupabaseAdminClient } from "@/lib/db/server";

type CreateRequestBody = {
  sender?: string;
  receiver?: string;
  user1?: string;
  user2?: string;
  amount?: number | string;
  message?: string | null;
};

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody<CreateRequestBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const sender = (body.sender ?? body.user1)?.trim();
  const receiver = (body.receiver ?? body.user2)?.trim();
  const amount = parsePositiveAmount(body.amount);
  const message = body.message?.trim() || null;

  if (!sender || !receiver || !amount) {
    return badRequest("sender, receiver and amount are required.");
  }

  if (sender === receiver) {
    return badRequest("sender and receiver must be different users.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("requests")
      .insert({
        sender,
        receiver,
        amount,
        message,
        status: "open",
      })
      .select("uid, ts, status")
      .single();

    if (error) {
      return internalError(error.message);
    }

    return created({
      uid: data.uid,
      time: data.ts,
      status: data.status,
    });
  } catch (error) {
    return internalError(error);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sender = url.searchParams.get("sender")?.trim() ?? null;
  const receiver = url.searchParams.get("receiver")?.trim() ?? null;
  const status = url.searchParams.get("status")?.trim() ?? null;
  const limit = parseLimit(url.searchParams.get("limit"));

  if (status && !isRequestStatus(status)) {
    return badRequest(
      "status must be one of: open, accepted, rejected, cancelled, expired.",
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("requests")
      .select("uid, sender, receiver, amount, ts, status, message")
      .order("ts", { ascending: false })
      .limit(limit);

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
      requests: (data as RequestRow[]).map(toRequestResponse),
    });
  } catch (error) {
    return internalError(error);
  }
}
