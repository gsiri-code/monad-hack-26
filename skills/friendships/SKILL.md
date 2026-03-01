---
name: friendships
description: Create, list, and delete friendships between users
---

# Friendships Skill

Manage bidirectional friendships between users.

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

> **All calls must go through the bridge proxy** — use `POST $MONAD_API_URL/api/chat/proxy` with your `sessionId`. Never use a raw Bearer token.

## Endpoints

### 1. Create Friendship

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/users/MY_UID/friendships",
    "method": "POST",
    "body": {"friendUid": "TARGET_USER_UID"}
  }'
```

**Response** (`201`):
```json
{"friendship": {"uid": "fid", "userA": "uid1", "userB": "uid2", "createdAt": "2026-02-28T12:00:00.000Z"}}
```

**Error `409`**: friendship already exists.

### 2. List Friendships

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/users/MY_UID/friendships?limit=50","method":"GET"}'
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
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/users/MY_UID/friendships/FRIEND_UID","method":"DELETE"}'
```

**Response** (`200`): returns the deleted friendship object.

## How to Use

- "Add friend USER_UID"
- "List my friends"
- "Find friend with username bob"
- "Remove friend USER_UID"

## Safety Constraints

- `MY_UID` must be the authenticated user's profile uid (`403` otherwise).
- Friendships are symmetric: deleting from either side removes for both.
- `409` on create = already friends; `404` on delete = not friends.
- If the proxy returns `401 reauth_required`, guide the user through re-auth. Do NOT re-auth for any other reason.
