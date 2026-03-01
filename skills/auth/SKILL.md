---
name: auth
description: Authenticate users via OTP email flow and inspect current session
---

# Auth Skill

Manage user authentication through Supabase magic-link OTP for the Monad Hack 26 API. Covers sending a one-time code, verifying it for session tokens, logging out, and fetching the current user.

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Endpoints

### 1. Send OTP

Sends a 6-digit one-time code to the given email. Creates the Supabase auth user if they do not exist.

```bash
curl -s -X POST "$MONAD_API_URL/api/auth/otp/send" \
  -H "Content-Type: application/json" \
  -d '{"email":"USER_EMAIL"}'
```

**Response** (`200`): `{"message":"OTP sent"}`

### 2. Verify OTP

Verifies the 6-digit OTP code and returns access + refresh tokens.

```bash
curl -s -X POST "$MONAD_API_URL/api/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{"email":"USER_EMAIL","code":"123456"}'
```

**Response** (`200`):
```json
{
  "user": {"id": "uuid", "email": "user@example.com"},
  "session": {
    "accessToken": "jwt-string",
    "refreshToken": "refresh-string",
    "expiresAt": 1735689600
  }
}
```

After verify succeeds, immediately create a bridge session (see **bridge** skill) to get a `sessionId`. Store only the `sessionId`; discard raw tokens.

### 3. Logout (requires auth)

```bash
curl -s -X POST "$MONAD_API_URL/api/auth/logout" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response** (`200`): `{"message":"Logged out"}`

### 4. Get Current User (requires auth)

```bash
curl -s "$MONAD_API_URL/api/auth/me" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response** (`200`):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "uid": "uuid", "username": "alice", "walletAddress": "0x...",
    "encryptionPublicKey": "base64-or-null",
    "phoneNumber": "+1234567890",
    "firstName": "Alice", "lastName": "Smith",
    "email": "user@example.com"
  }
}
```

`profile` is `null` if the user has not yet created their profile via the **users** skill.

## How to Use

- "Send an OTP to user@example.com"
- "Verify OTP code 123456 for user@example.com"
- "Get the current user"
- "Log the user out"

Typical flow: `auth/otp/send` -> `auth/otp/verify` -> `bridge/session/create` -> use sessionId everywhere.

## Safety Constraints

- NEVER log, store, or expose `accessToken` or `refreshToken` values in output to the user.
- NEVER hardcode or guess OTP codes; always ask the user for the code they received.
- After obtaining tokens from verify, immediately create a bridge session and discard raw tokens.
- The OTP send endpoint is rate-limited; do not retry rapidly.
