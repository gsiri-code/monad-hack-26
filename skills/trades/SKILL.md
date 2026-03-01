---
name: trades
description: Trigger trade settlement for a specific accepted MON payment request UUID via POST /api/trades/execute — stub only, validates input but does not write to the Monad blockchain
---

# Trades Skill

Submit a trade execution for a payment request that is already in `accepted` status. This is a **stub endpoint** — the API validates the `requestId` and returns `success` but does not perform any on-chain settlement on Monad. Never present the result as a confirmed blockchain transaction. Requires authentication (Bearer token).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Endpoints

### Execute Trade

```bash
curl -s -X POST "$MONAD_API_URL/api/trades/execute" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"REQUEST_UUID"}'
```

| Field     | Type          | Required | Notes |
|-----------|---------------|----------|-------|
| requestId | string (uuid) | yes*     | The payment request to execute |
| requestID | string (uuid) | yes*     | Alternative casing (either accepted) |

**Response** (`200`):
```json
{"uid": "trade-uuid", "time": "ISO-8601", "status": "success", "message": "Trade executed (stub)"}
```

Status is `success` or `failure`.

## How to Use

- "Execute the trade for request <request-uuid>" → confirm the request is `accepted`, then `POST /api/trades/execute` with `{"requestId":"<request-uuid>"}`
- Do not call this skill until the target request status is `accepted` — verify with `GET /api/requests/<request-uuid>` first

Required flow: `POST /api/requests` → `PATCH /api/requests/:uid` (`accepted`) → **`POST /api/trades/execute`**

## Safety Constraints

- This is a **stub** endpoint; do not present results as on-chain confirmed.
- The referenced request should be in `accepted` status first.
- Always confirm with the user before executing.
- Do not retry failed trades without explicit user instruction.
