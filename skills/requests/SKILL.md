---
name: requests
description: Create a MON payment request from one Monad user to another via POST /api/requests, then accept, reject, or cancel it via PATCH /api/requests/:uid; list and filter by status (open|accepted|rejected|cancelled|expired)
---

# Requests Skill

Create pull-style MON payment requests where the sender asks the receiver to pay. Lifecycle: `open` → `accepted` | `rejected` | `cancelled` | `expired`. Only the sender can cancel; only the receiver can accept or reject. Accepting an `open` request is the prerequisite for running the **trades** skill. All endpoints require authentication (Bearer token).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

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
curl -s -X POST "$MONAD_API_URL/api/requests" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sender":"SENDER_UID","receiver":"RECEIVER_UID","amount":"25.5","message":"Lunch money"}'
```

| Field    | Type             | Required | Notes |
|----------|------------------|----------|-------|
| sender   | string (uuid)    | no*      | Must match authed user. Alt: `user1` |
| receiver | string (uuid)    | no*      | Alt: `user2` |
| amount   | number or string | yes      | Must be > 0 |
| message  | string or null   | no       | Optional memo |

*Either `sender`/`receiver` or `user1`/`user2` pair required.

**Response** (`201`): `{"uid": "request-uuid", "time": "ISO-8601", "status": "open"}`

### 2. List Requests

```bash
curl -s "$MONAD_API_URL/api/requests?status=open&limit=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Query params: `sender`, `receiver`, `status` (open|accepted|rejected|cancelled|expired), `limit` (1-200).

**Response** (`200`):
```json
{"requests": [{"uid":"...", "sender":"...", "receiver":"...", "amount":"25.5", "timestamp":"...", "status":"open", "message":"..."}]}
```

### 3. Get Request

```bash
curl -s "$MONAD_API_URL/api/requests/REQUEST_UID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Update Request Status

```bash
curl -s -X PATCH "$MONAD_API_URL/api/requests/REQUEST_UID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

| Field   | Type   | Required | Values |
|---------|--------|----------|--------|
| status  | string | yes      | `accepted`, `rejected`, `cancelled` |
| message | string | no       | Optional note |

## How to Use

- "Ask bob to pay me 25 MON for lunch" → resolve bob's UID, confirm amount + message, then `POST /api/requests` with `{"sender":"<myUid>","receiver":"<bobUid>","amount":"25","message":"Lunch"}`
- "Show my pending requests" → `GET /api/requests?status=open&limit=50`
- "Accept request <request-uuid>" → `PATCH /api/requests/<request-uuid>` with `{"status":"accepted"}` (only valid if you are the receiver)
- "Decline request <request-uuid>" → `PATCH /api/requests/<request-uuid>` with `{"status":"rejected"}`
- "Cancel my request <request-uuid>" → `PATCH /api/requests/<request-uuid>` with `{"status":"cancelled"}` (only valid if you are the sender)

## Safety Constraints

- `sender` must match the authenticated user when creating.
- Only the sender can cancel; only the receiver can accept/reject.
- Amounts must be > 0 and are decimal strings.
- Confirm request details with the user before creating or accepting.
