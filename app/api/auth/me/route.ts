import { internalError, ok, unauthorized } from "@/lib/api/http";
import { getAuthUser } from "@/lib/db/auth-server";
import { getSupabaseAdminClient } from "@/lib/db/server";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("users")
      .select("uid, username, wallet_address, encryption_public_key, phone_number, first_name, last_name, email")
      .eq("uid", user.id)
      .maybeSingle();

    return ok({
      id: user.id,
      email: user.email,
      profile: profile
        ? {
            uid: profile.uid,
            username: profile.username,
            walletAddress: profile.wallet_address,
            encryptionPublicKey: profile.encryption_public_key,
            phoneNumber: profile.phone_number,
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
          }
        : null,
    });
  } catch (error) {
    return internalError(error);
  }
}
