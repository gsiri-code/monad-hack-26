export type FriendshipRow = {
  uid: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type FriendUserRow = {
  friendship_uid: string;
  created_at: string;
  friend_uid: string;
  username: string;
  wallet_address: string;
  phone_number: string;
};

export function canonicalFriendPair(userId: string, friendId: string) {
  return userId < friendId
    ? { userA: userId, userB: friendId }
    : { userA: friendId, userB: userId };
}

export function parseFriendshipsLimit(value: string | null, defaultValue = 50) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 200);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function normalizePhone(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
