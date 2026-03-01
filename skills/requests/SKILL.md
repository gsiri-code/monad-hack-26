---
name: requests
description: Create, list, fetch, and update payment requests between users
---

# Requests Skill

Manage payment requests between users. Lifecycle: `open` → `accepted` | `rejected` | `cancelled` | `expired`.

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

> **All calls must go through the bridge proxy** — use `POST $MONAD_API_URL/api/chat/proxy` with your `sessionId`. Never use a raw Bearer token.

## Status Lifecycle

| Status    | Who can set it | Description |
|-----------|----------------|-------------|
| open      | (auto)         | Newly created |
| accepted  | receiver       | Receiver agreed to pay |
| rejected  | receiver       | Receiver declined |
| cancelled | sender         | Sender withdrew the request |
| expired   | (auto)         | Timed out |

## Endpoints

### 1. Create Request

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/requests",
    "method": "POST",
    "body": {"sender":"SENDER_UID","receiver":"RECEIVER_UID","amount":"25.5","message":"Lunch money"}
  }'
```

| Field    | Type             | Required | Notes |
|----------|------------------|----------|-------|
| sender   | string (uuid)    | no*      | Must match authed user. Alt: `user1` |
| receiver | string (uuid)    | no*      | Alt: `user2` |
| amount   | number or string | yes      | Must be > 0 |
| message  | string or null   | no       | Optional memo |

**Response** (`201`): `{"uid": "request-uuid", "time": "ISO-8601", "status": "open"}`

### 2. List Requests

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/requests?status=open&limit=50","method":"GET"}'
```

Query params: `sender`, `receiver`, `status` (open|accepted|rejected|cancelled|expired), `limit` (1-200).

**Response** (`200`):
```json
{"requests": [{"uid":"...", "sender":"...", "receiver":"...", "amount":"25.5", "timestamp":"...", "status":"open", "message":"..."}]}
```

### 3. Get Request

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/requests/REQUEST_UID","method":"GET"}'
```

### 4. Update Request Status

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/requests/REQUEST_UID",
    "method": "PATCH",
    "body": {"status":"accepted"}
  }'
```

| Field   | Type   | Required | Values |
|---------|--------|----------|--------|
| status  | string | yes      | `accepted`, `rejected`, `cancelled` |
| message | string | no       | Optional note |

## How to Use

- "Request 25 MON from USER_UID with message 'Lunch'"
- "List my open requests"
- "Accept request REQUEST_UID"
- "Reject request REQUEST_UID"
- "Cancel request REQUEST_UID"

## Safety Constraints

- `sender` must match the authenticated user when creating.
- Only the sender can cancel; only the receiver can accept/reject.
- Amounts must be > 0 and are decimal strings.
- Confirm request details with the user before creating or accepting.
- If the proxy returns `401 reauth_required`, guide the user through re-auth. Do NOT re-auth for any other reason.
