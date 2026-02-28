import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function internalError(cause?: string | unknown) {
  if (cause !== undefined) console.error("[internal error]", cause);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function parseJsonBody<T = unknown>(
  request: Request,
): Promise<{ body: T; response?: undefined } | { body?: undefined; response: Response }> {
  try {
    return { body: (await request.json()) as T };
  } catch {
    return { response: badRequest("Request body must be valid JSON.") };
  }
}

export function requireUid(
  value: string | undefined,
  label = "uid",
): { uid: string; response?: undefined } | { uid?: undefined; response: Response } {
  if (!value) return { response: badRequest(`${label} is required.`) };
  if (!isUuid(value)) return { response: badRequest(`${label} must be a valid UUID.`) };
  return { uid: value };
}
