import { badRequest, conflict, created, internalError, isUniqueViolation } from "@/lib/api/http";
import { getSupabaseAdminClient } from "@/lib/db/server";

type CreateUserBody = {
  username?: string;
  walletAddress?: string;
};

export async function POST(request: Request) {
  let body: CreateUserBody;

  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const username = body.username?.trim();
  const walletAddress = body.walletAddress?.trim();

  if (!username || !walletAddress) {
    return badRequest("username and walletAddress are required.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        wallet_address: walletAddress,
      })
      .select("uid, username, wallet_address")
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return conflict("username or walletAddress already exists.");
      }
      return internalError(error.message);
    }

    return created({
      user: {
        uid: data.uid,
        username: data.username,
        walletAddress: data.wallet_address,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
