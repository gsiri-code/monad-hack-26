---
name: users
description: Create a one-time Monad user profile (username, Monad wallet address, phone, name) via POST /api/users, and query MON token balance via GET /api/users/:uid/wallet
---

# Users Skill

Create the authenticated user's Monad profile row (once per identity) and fetch their MON token balance. Profile creation requires a Monad-compatible wallet address supplied by the user — never fabricate one. All endpoints require authentication (Bearer token).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Endpoints

### 1. Create User Profile

Creates the profile row linked to the authenticated user. Call once after first OTP verify.

```bash
curl -s -X POST "$MONAD_API_URL/api/users" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "walletAddress": "0xabc...",
    "phoneNumber": "+15551234567",
    "firstName": "Alice",
    "lastName": "Smith",
    "encryptionPublicKey": "optional-base64-key"
  }'
```

| Field               | Type   | Required | Notes |
|---------------------|--------|----------|-------|
| username            | string | yes      | Unique, min 1 char |
| walletAddress       | string | yes      | Blockchain wallet address |
| phoneNumber         | string | yes      | Phone number |
| firstName           | string | yes      | First name |
| lastName            | string | yes      | Last name |
| encryptionPublicKey | string | no       | For private (encrypted) transactions |

**Response** (`201`): `{"user": { uid, username, walletAddress, ... }}`

**Error `409`**: profile already exists.

### 2. Get Wallet Balances

Returns MON balance. The `uid` must match the authenticated user.

```bash
curl -s "$MONAD_API_URL/api/users/USER_UID/wallet" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Response** (`200`):
```json
{
  "uid": "uuid",
  "wallet": [{"currencyName": "MON", "amount": "100.5"}]
}
```

`amount` is a decimal string.

## How to Use

- "Set up my profile — username alice, wallet 0xabc123..., phone +15551234567" → calls `POST /api/users` (fails with `409` if already created)
- "What's my MON balance?" → calls `GET /api/users/<uid>/wallet` using the uid from `GET /api/auth/me`
- Profile `uid` comes from `auth/me` response; never guess or hardcode it

## Safety Constraints

- Profile creation is one-time per identity; `409` means it exists already.
- The `uid` in wallet path must match the authenticated user (`403` otherwise).
- Do NOT fabricate wallet addresses; always get them from the user.
- Amounts are decimal strings; handle with proper decimal arithmetic.
