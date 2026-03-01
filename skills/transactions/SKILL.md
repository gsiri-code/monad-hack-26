---
name: transactions
description: Send MON tokens publicly (visible amount) via POST /api/public-transaction/execute, or send E2E ECDH-encrypted private transfers via POST /api/private-transactions/execute; also list and fetch private transaction records
---

# Transactions Skill

Send MON token transfers between Monad user wallets. Public transactions expose the amount on-ledger; private transactions require the sender to ECDH-encrypt the payload client-side using the receiver's `encryptionPublicKey` before calling the API — the agent cannot generate ciphertext. All endpoints require authentication (Bearer token).

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

## Execution Status

| Status  | Meaning |
|---------|---------|
| pending | Submitted, not yet confirmed |
| success | Completed |
| failure | Failed |

## Endpoints

### 1. Execute Public Transaction

```bash
curl -s -X POST "$MONAD_API_URL/api/public-transaction/execute" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sender":"SENDER_UID","receiver":"RECEIVER_UID","amount":"10.5","message":"Payment"}'
```

| Field    | Type             | Required | Notes |
|----------|------------------|----------|-------|
| sender   | string (uuid)    | no*      | Must match authed user. Alt: `user1` |
| receiver | string (uuid)    | no*      | Alt: `user2` |
| amount   | number or string | yes      | Must be > 0 |
| message  | string or null   | no       | Optional memo |
| status   | string           | no       | pending, success, failure |

**Response** (`200`):
```json
{"uid":"txn-uuid", "time":"ISO-8601", "status":"success", "sender":"...", "receiver":"...", "type":"public"}
```

### 2. Execute Private Transaction

Encrypted transaction; payload is encrypted client-side using receiver's public key.

```bash
curl -s -X POST "$MONAD_API_URL/api/private-transactions/execute" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender":"SENDER_UID","receiver":"RECEIVER_UID",
    "ciphertext":"encrypted-base64","nonce":"nonce-base64",
    "senderPublicKeyUsed":"pubkey-base64"
  }'
```

| Field                | Type   | Required | Notes |
|----------------------|--------|----------|-------|
| sender / user1       | uuid   | no*      | Sender |
| receiver / user2     | uuid   | no*      | Receiver |
| ciphertext           | string | no       | Alt: `payloadCiphertext` |
| nonce                | string | no       | Alt: `payloadNonce` |
| senderPublicKeyUsed  | string | no       | Alt: `senderPubkeyUsed` |
| status               | string | no       | pending, success, failure |

**Response** (`200`): same shape as public but `"type":"private"`.

### 3. List Private Transactions

```bash
curl -s "$MONAD_API_URL/api/private-transactions?status=success&limit=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Query params: `sender`, `receiver`, `status` (pending|success|failure), `limit` (1-200).

**Response** (`200`):
```json
{"privateTransactions": [{"uid":"...", "sender":"...", "receiver":"...", "ciphertext":"...", "nonce":"...", "senderPublicKeyUsed":"...", "timestamp":"...", "status":"success"}]}
```

### 4. Get Private Transaction

```bash
curl -s "$MONAD_API_URL/api/private-transactions/TXN_UID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## How to Use

- "Send 10.5 MON to alice" → resolve alice's UID from friendships, confirm recipient + amount with user, then `POST /api/public-transaction/execute` with `{"sender":"<myUid>","receiver":"<aliceUid>","amount":"10.5"}`
- "Send a private payment to bob" → tell the user the agent cannot encrypt; they must provide `ciphertext`, `nonce`, and `senderPublicKeyUsed` from client-side ECDH before calling `POST /api/private-transactions/execute`
- "Show my private transaction history" → `GET /api/private-transactions?status=success&limit=50`
- "Look up transaction <txn-uuid>" → `GET /api/private-transactions/<txn-uuid>`

## Safety Constraints

- `sender` must match the authenticated user.
- Amounts must be > 0 and are decimal strings.
- For private transactions, encryption must happen client-side. Do NOT fabricate ciphertext/nonce/keys.
- Always confirm transaction details (recipient + amount) with the user before executing.
- Transactions are irreversible once `success`.
