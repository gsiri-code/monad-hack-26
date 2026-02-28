import { badRequest, conflict, created, internalError, notFound, ok, isUniqueViolation, parseJsonBody, requireUid } from "@/lib/api/http";
import {
  canonicalFriendPair,
  isUuid,
  normalizePhone,
  parseFriendshipsLimit,
  type FriendUserRow,
} from "@/lib/api/friendships";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string }>;
};

type CreateFriendshipBody = {
  friendUid?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const uidResult = requireUid((await params).uid);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  const bodyResult = await parseJsonBody<CreateFriendshipBody>(request);
  if (bodyResult.response) return bodyResult.response;
  const { body } = bodyResult;

  const friendUid = body.friendUid?.trim();

  if (!friendUid) {
    return badRequest("friendUid is required.");
  }

  if (!isUuid(friendUid)) {
    return badRequest("friendUid must be a valid UUID.");
  }

  if (uid === friendUid) {
    return badRequest("A user cannot befriend themselves.");
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("uid")
      .in("uid", [uid, friendUid]);

    if (usersError) {
      return internalError(usersError.message);
    }

    if (!users || users.length !== 2) {
      return notFound("One or both users were not found.");
    }

    const { userA, userB } = canonicalFriendPair(uid, friendUid);

    const { data, error } = await supabase
      .from("friendships")
      .insert({
        user_a: userA,
        user_b: userB,
      })
      .select("uid, user_a, user_b, created_at")
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return conflict("Friendship already exists.");
      }
      return internalError(error.message);
    }

    return created({
      friendship: {
        uid: data.uid,
        userA: data.user_a,
        userB: data.user_b,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    return internalError(error);
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const uidResult = requireUid((await params).uid);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  const url = new URL(request.url);
  const usernameFilter = url.searchParams.get("username")?.trim() ?? "";
  const phoneFilterRaw = url.searchParams.get("phoneNumber")?.trim() ?? "";
  const phoneFilter = normalizePhone(phoneFilterRaw);
  const limit = parseFriendshipsLimit(url.searchParams.get("limit"));

  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc("list_user_friendships", {
      p_user_uid: uid,
      p_username: usernameFilter || null,
      p_phone: phoneFilter || null,
      p_limit: limit,
    });

    if (error) {
      return internalError(error.message);
    }

    const responseRows = ((data ?? []) as FriendUserRow[]).map((row) => ({
      uid: row.friendship_uid,
      createdAt: row.created_at,
      friend: {
        uid: row.friend_uid,
        username: row.username,
        walletAddress: row.wallet_address,
        phoneNumber: row.phone_number,
      },
    }));

    return ok({ friendships: responseRows });
  } catch (error) {
    return internalError(error);
  }
}
