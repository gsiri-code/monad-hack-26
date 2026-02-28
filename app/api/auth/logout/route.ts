import { internalError, ok } from "@/lib/api/http";
import { getSupabaseAuthServerClient } from "@/lib/db/auth-server";

export async function POST() {
  try {
    const supabase = await getSupabaseAuthServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return internalError(error.message);
    }

    return ok({ message: "Logged out." });
  } catch (error) {
    return internalError(error);
  }
}
