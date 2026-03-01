---
name: trades
description: Execute trades against accepted payment requests
---

# Trades Skill

Execute trades based on accepted payment requests. Currently a stub endpoint (validates input, does not settle on-chain). Requires authentication (Bearer token).

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

- "Execute trade for request REQUEST_UID"

Flow: `requests/create` -> `requests/update(accepted)` -> `trades/execute`

## Safety Constraints

- This is a **stub** endpoint; do not present results as on-chain confirmed.
- The referenced request should be in `accepted` status first.
- Always confirm with the user before executing.
- Do not retry failed trades without explicit user instruction.
