import { badRequest, internalError, ok, parseJsonBody } from "@/lib/api/http";
import { getSupabaseAuthServerClient } from "@/lib/db/auth-server";

type VerifyBody = {
  email?: string;
  code?: string;
};

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody<VerifyBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const email = body.email?.trim().toLowerCase();
  const token = body.code?.trim();

  if (!email || !token) {
    return badRequest("email and code are required.");
  }

  try {
    const supabase = await getSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return badRequest(error.message);
    }

    if (!data.user || !data.session) {
      return internalError("Verification succeeded but no session was created.");
    }

    return ok({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at,
      },
    });
  } catch (error) {
    return internalError(error);
  }
}
