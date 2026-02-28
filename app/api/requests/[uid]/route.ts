import { badRequest, forbidden, internalError, notFound, ok, parseJsonBody, requireUid, unauthorized } from "@/lib/api/http";
import {
  isPatchStatus,
  toRequestResponse,
  type RequestRow,
} from "@/lib/api/requests";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

type PatchRequestBody = {
  status?: string;
  message?: string | null;
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

    const row = data as RequestRow;
    if (row.sender !== user.id && row.receiver !== user.id) {
      return forbidden("Access denied.");
    }

    return ok(toRequestResponse(row));
  } catch (error) {
    return internalError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const uidResult = requireUid((await params).uid);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  const bodyResult = await parseJsonBody<PatchRequestBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

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

    // Fetch first to verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("requests")
      .select("uid, sender, receiver, amount, ts, status, message")
      .eq("uid", uid)
      .maybeSingle();

    if (fetchError) {
      return internalError(fetchError.message);
    }

    if (!existing) {
      return notFound("request not found.");
    }

    const existingRow = existing as RequestRow;
    if (existingRow.sender !== user.id && existingRow.receiver !== user.id) {
      return forbidden("Access denied.");
    }

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
    return internalError(error);
  }
}
