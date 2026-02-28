import { badRequest, internalError, notFound, ok, requireUid } from "@/lib/api/http";
import { canonicalFriendPair } from "@/lib/api/friendships";
import { getSupabaseAdminClient } from "@/lib/db/server";

type RouteParams = {
  params: Promise<{ uid: string; friendUid: string }>;
};

export async function DELETE(_: Request, { params }: RouteParams) {
  const { uid: uidParam, friendUid: friendUidParam } = await params;

  const uidResult = requireUid(uidParam);
  if (uidResult.response) return uidResult.response;
  const { uid } = uidResult;

  const friendUidResult = requireUid(friendUidParam, "friendUid");
  if (friendUidResult.response) return friendUidResult.response;
  const { uid: friendUid } = friendUidResult;

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
    return internalError(error);
  }
}
