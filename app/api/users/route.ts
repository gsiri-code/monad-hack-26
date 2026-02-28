import { badRequest, conflict, created, internalError, isUniqueViolation } from "@/lib/api/http";
import argon2 from "argon2";
import { getSupabaseAdminClient } from "@/lib/db/server";

type CreateUserBody = {
  username?: string;
  walletAddress?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
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
  const phoneNumber = body.phoneNumber?.trim();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase() || null;
  const password = body.password;

  if (
    !username ||
    !walletAddress ||
    !phoneNumber ||
    !firstName ||
    !lastName ||
    !password
  ) {
    return badRequest(
      "username, walletAddress, phoneNumber, firstName, lastName and password are required.",
    );
  }

  if (password.length < 8) {
    return badRequest("password must be at least 8 characters long.");
  }

  try {
    const supabase = getSupabaseAdminClient();
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        wallet_address: walletAddress,
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: passwordHash,
      })
      .select(
        "uid, username, wallet_address, phone_number, first_name, last_name, email",
      )
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return conflict(
          "username, walletAddress, phoneNumber or email already exists.",
        );
      }
      return internalError(error.message);
    }

    return created({
      user: {
        uid: data.uid,
        username: data.username,
        walletAddress: data.wallet_address,
        phoneNumber: data.phone_number,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
