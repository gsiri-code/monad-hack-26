---
name: trades
description: Execute trades against accepted payment requests
---

# Trades Skill

Execute trades based on accepted payment requests. Currently a stub endpoint (validates input, does not settle on-chain).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

> **All calls must go through the bridge proxy** — use `POST $MONAD_API_URL/api/chat/proxy` with your `sessionId`. Never use a raw Bearer token.

## Endpoints

### Execute Trade

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/trades/execute",
    "method": "POST",
    "body": {"requestId":"REQUEST_UUID"}
  }'
```

| Field     | Type          | Required | Notes |
|-----------|---------------|----------|-------|
| requestId | string (uuid) | yes*     | The payment request to execute |
| requestID | string (uuid) | yes*     | Alternative casing (either accepted) |

**Response** (`200`):
```json
{"uid": "trade-uuid", "time": "ISO-8601", "status": "success", "message": "Trade executed (stub)"}
```

## How to Use

- "Execute trade for request REQUEST_UID"

Flow: `requests/create` → `requests/update(accepted)` → `trades/execute`

## Safety Constraints

- This is a **stub** endpoint; do not present results as on-chain confirmed.
- The referenced request should be in `accepted` status first.
- Always confirm with the user before executing.
- Do not retry failed trades without explicit user instruction.
- If the proxy returns `401 reauth_required`, guide the user through re-auth. Do NOT re-auth for any other reason.
