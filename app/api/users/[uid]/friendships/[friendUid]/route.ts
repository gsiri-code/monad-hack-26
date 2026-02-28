import { badRequest, internalError, notFound, ok } from "@/lib/api/http";
import { canonicalFriendPair, isUuid } from "@/lib/api/friendships";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string; friendUid: string }>;
};

export async function DELETE(_: Request, { params }: RouteParams) {
  const { uid, friendUid } = await params;

  if (!uid || !friendUid) {
    return badRequest("uid and friendUid are required.");
  }

  if (!isUuid(uid) || !isUuid(friendUid)) {
    return badRequest("uid and friendUid must be valid UUIDs.");
  }

  if (uid === friendUid) {
    return badRequest("uid and friendUid must be different users.");
  }

  try {
    const { userA, userB } = canonicalFriendPair(uid, friendUid);
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .eq("user_a", userA)
      .eq("user_b", userB)
      .select("uid, user_a, user_b, created_at")
      .maybeSingle();

    if (error) {
      return internalError(error.message);
    }

    if (!data) {
      return notFound("Friendship not found.");
    }

    return ok({
      friendship: {
        uid: data.uid,
        userA: data.user_a,
        userB: data.user_b,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
}
