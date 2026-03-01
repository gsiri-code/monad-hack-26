import { badRequest, internalError, ok, parseJsonBody } from "@/lib/api/http";
import { getSupabaseAuthServerClient } from "@/lib/db/auth-server";

type SendBody = {
  email?: string;
};

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody<SendBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return badRequest("email is required.");
  }

  try {
    const supabase = await getSupabaseAuthServerClient();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      return internalError(error.message);
    }

    return ok({ message: "Magic link sent." });
  } catch (error) {
    return internalError(error);
  }
}
