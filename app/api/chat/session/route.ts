import { getAuthUser } from "@/lib/db/auth-server";
import { createSession } from "@/lib/bridge/session";
import { unauthorized, badRequest, internalError, ok, parseJsonBody } from "@/lib/api/http";

type SessionBody = {
  refreshToken?: string;
};

/** Decodes the `exp` claim from a JWT without verifying the signature. */
function jwtExpiresAt(token: string): Date {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    if (payload.exp) return new Date(payload.exp * 1000);
  } catch {
    // fall through
  }
  return new Date(Date.now() + 3600_000); // default 1h
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const bodyResult = await parseJsonBody<SessionBody>(request);
  if (bodyResult.response) return bodyResult.response;

  const refreshToken = bodyResult.body?.refreshToken?.trim();
  if (!refreshToken) return badRequest("refreshToken is required.");

  // Extract access token from Authorization header (getAuthUser already validated it)
  const authHeader = request.headers.get("Authorization") ?? request.headers.get("authorization");
  const accessToken = authHeader!.slice(7); // "Bearer " prefix

  try {
    const expiresAt = jwtExpiresAt(accessToken);
    const sessionId = await createSession(user.id, accessToken, refreshToken, expiresAt);
    return ok({ sessionId });
  } catch (err) {
    return internalError(err);
  }
}
