---
name: users
description: Create user profiles and retrieve wallet balances
---

# Users Skill

Create user profiles and query MON wallet balances. All endpoints require authentication (Bearer token).

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

- "Create user profile for alice with wallet 0xabc..."
- "Check my wallet balance" (needs user uid from auth/me)

## Safety Constraints

- Profile creation is one-time per identity; `409` means it exists already.
- The `uid` in wallet path must match the authenticated user (`403` otherwise).
- Do NOT fabricate wallet addresses; always get them from the user.
- Amounts are decimal strings; handle with proper decimal arithmetic.
