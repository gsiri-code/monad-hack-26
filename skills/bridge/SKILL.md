---
name: bridge
description: Exchange Supabase accessToken + refreshToken for an AES-256-GCM encrypted opaque sessionId stored server-side at POST /api/chat/session, or revoke it via DELETE
---

# Bridge Skill

Immediately after `auth/otp/verify` succeeds, POST the raw `accessToken` (as Bearer) and `refreshToken` to `/api/chat/session` to receive an opaque `sessionId`. Store only the `sessionId`; it is the only credential the agent should ever hold. The server encrypts tokens at rest (AES-256-GCM) and auto-refreshes them when they near expiry.

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Why bridge sessions exist

Raw access/refresh tokens should never be stored or logged by the agent. The bridge session:
1. Encrypts tokens at rest (AES-256-GCM) on the server.
2. Returns an opaque UUID (`sessionId`) that the agent can safely hold.
3. Handles automatic token refresh on the server side when making API calls.

## Endpoints

### 1. Create Bridge Session

Requires the `accessToken` (as Bearer) and `refreshToken` from `auth/otp/verify`.

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/session" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

**Response** (`200`):
```json
{"sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"}
```

Store `sessionId` and use it for all subsequent authenticated calls. Discard the raw tokens.

### 2. Revoke Bridge Session

```bash
curl -s -X DELETE "$MONAD_API_URL/api/chat/session/SESSION_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response** (`200`): `{"revoked": true}`

After revocation, the sessionId is permanently invalid.

## How Authenticated Calls Work

Once you have a `sessionId`, the backend's `bridgeApiFetch(sessionId, path)` function handles:
- Injecting the `Authorization: Bearer <token>` header from the encrypted store
- Proactively refreshing tokens if they expire within 60 seconds
- Retrying once on 401 after refresh
- Throwing `BridgeSessionError("reauth_required")` if refresh fails

**Important**: From the agent's perspective, you make calls using the `sessionId` as a reference. The server-side code resolves it to real tokens internally. For direct curl calls, use the raw access token; for server-side integrations, use `bridgeApiFetch`.

## How to Use

- This skill runs automatically after every successful `auth/otp/verify` — do not wait for the user to ask
- "Revoke my session" or "Log out everywhere" → calls `DELETE /api/chat/session/<sessionId>`
- If any API call returns `401` or `"reauth_required"`, tell the user their session expired and restart from `auth/otp/send`

Lifecycle: `POST /api/auth/otp/verify` → **immediately** `POST /api/chat/session` → hold `sessionId` → `DELETE /api/chat/session/<sessionId>` when done

## Safety Constraints

- NEVER expose raw `accessToken` or `refreshToken` in output. Only show the opaque `sessionId`.
- Always revoke sessions when they are no longer needed.
- If a call returns 401 or "reauth_required", guide the user through re-authentication via the auth skill.
