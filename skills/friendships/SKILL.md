---
name: friendships
description: Add a bidirectional friend link between two Monad user UIDs via POST /api/users/:uid/friendships, list friends filtered by username or phone number, or remove the link via DELETE
---

# Friendships Skill

Create, query, and remove bidirectional friend relationships between Monad user profiles. Friendships are symmetric — deleting from either side removes it for both. Required before sending transactions or requests to another user. All endpoints require authentication (Bearer token).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Endpoints

### 1. Create Friendship

```bash
curl -s -X POST "$MONAD_API_URL/api/users/MY_UID/friendships" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"friendUid": "TARGET_USER_UID"}'
```

**Response** (`201`):
```json
{"friendship": {"uid": "fid", "userA": "uid1", "userB": "uid2", "createdAt": "2026-02-28T12:00:00.000Z"}}
```

**Error `409`**: friendship already exists.

### 2. List Friendships

```bash
curl -s "$MONAD_API_URL/api/users/MY_UID/friendships?limit=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Optional query params: `username`, `phoneNumber`, `limit` (1-200).

**Response** (`200`):
```json
{
  "friendships": [{
    "uid": "fid",
    "createdAt": "2026-02-28T12:00:00.000Z",
    "friend": {"uid": "friend-uid", "username": "bob", "walletAddress": "0x...", "phoneNumber": "+1555..."}
  }]
}
```

### 3. Delete Friendship

```bash
curl -s -X DELETE "$MONAD_API_URL/api/users/MY_UID/friendships/FRIEND_UID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response** (`200`): returns the deleted friendship object.

## How to Use

- "Add bob as a friend" → look up bob's UID first (via list with `?username=bob`), then `POST /api/users/<myUid>/friendships` with `{"friendUid":"<bobUid>"}`
- "List my friends" → `GET /api/users/<myUid>/friendships?limit=50`
- "Find friend with phone +15559876543" → `GET /api/users/<myUid>/friendships?phoneNumber=%2B15559876543`
- "Remove alice from my friends" → `DELETE /api/users/<myUid>/friendships/<aliceUid>`

## Safety Constraints

- `MY_UID` must be the authenticated user's profile uid (`403` otherwise).
- Friendships are symmetric: deleting from either side removes for both.
- `409` on create = already friends; `404` on delete = not friends.
