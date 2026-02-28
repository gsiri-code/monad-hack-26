import { badRequest, internalError, notFound, ok } from "@/lib/api/http";
import {
  isPatchStatus,
  toRequestResponse,
  type RequestRow,
} from "@/lib/api/requests";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

type PatchRequestBody = {
  status?: string;
  message?: string | null;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { uid } = await params;

  if (!uid) {
    return badRequest("uid is required.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("requests")
      .select("uid, sender, receiver, amount, ts, status, message")
      .eq("uid", uid)
      .maybeSingle();

    if (error) {
      return internalError(error.message);
    }

    if (!data) {
      return notFound("request not found.");
    }

    return ok(toRequestResponse(data as RequestRow));
  } catch (error) {
    const messageText = error instanceof Error ? error.message : undefined;
    return internalError(messageText);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { uid } = await params;

  if (!uid) {
    return badRequest("uid is required.");
  }

  let body: PatchRequestBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const status = body.status?.trim();

  if (!status || !isPatchStatus(status)) {
    return badRequest("status must be one of: accepted, rejected, cancelled.");
  }

  const payload: { status: string; message?: string | null } = { status };
  if (body.message !== undefined) {
    payload.message = body.message === null ? null : body.message.trim();
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("requests")
      .update(payload)
      .eq("uid", uid)
      .select("uid, sender, receiver, amount, ts, status, message")
      .maybeSingle();

    if (error) {
      return internalError(error.message);
    }

    if (!data) {
      return notFound("request not found.");
    }

    return ok(toRequestResponse(data as RequestRow));
  } catch (error) {
    const messageText = error instanceof Error ? error.message : undefined;
    return internalError(messageText);
  }
}
