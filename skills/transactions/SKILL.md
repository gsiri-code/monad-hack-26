---
name: transactions
description: Execute and query public and private (encrypted) transactions
---

# Transactions Skill

Execute and query public (visible-amount) and private (E2E encrypted) transactions.

The base URL is `$MONAD_API_URL` (default: `http://localhost:3000`).

> **All calls must go through the bridge proxy** — use `POST $MONAD_API_URL/api/chat/proxy` with your `sessionId`. Never use a raw Bearer token.

## Execution Status

| Status  | Meaning |
|---------|---------|
| pending | Submitted, not yet confirmed |
| success | Completed |
| failure | Failed |

## Endpoints

### 1. Execute Public Transaction

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/public-transaction/execute",
    "method": "POST",
    "body": {"sender":"SENDER_UID","receiver":"RECEIVER_UID","amount":"10.5","message":"Payment"}
  }'
```

| Field    | Type             | Required | Notes |
|----------|------------------|----------|-------|
| sender   | string (uuid)    | no*      | Must match authed user. Alt: `user1` |
| receiver | string (uuid)    | no*      | Alt: `user2` |
| amount   | number or string | yes      | Must be > 0 |
| message  | string or null   | no       | Optional memo |

**Response** (`200`):
```json
{"uid":"txn-uuid", "time":"ISO-8601", "status":"success", "sender":"...", "receiver":"...", "type":"public"}
```

### 2. Execute Private Transaction

Encrypted transaction; payload must be encrypted client-side using receiver's public key.

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "path": "/api/private-transactions/execute",
    "method": "POST",
    "body": {
      "sender":"SENDER_UID","receiver":"RECEIVER_UID",
      "ciphertext":"encrypted-base64","nonce":"nonce-base64",
      "senderPublicKeyUsed":"pubkey-base64"
    }
  }'
```

**Response** (`200`): same shape as public but `"type":"private"`.

### 3. List Private Transactions

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/private-transactions?status=success&limit=50","method":"GET"}'
```

**Response** (`200`):
```json
{"privateTransactions": [{"uid":"...", "sender":"...", "receiver":"...", "ciphertext":"...", "nonce":"...", "senderPublicKeyUsed":"...", "timestamp":"...", "status":"success"}]}
```

### 4. Get Private Transaction

```bash
curl -s -X POST "$MONAD_API_URL/api/chat/proxy" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","path":"/api/private-transactions/TXN_UID","method":"GET"}'
```

## How to Use

- "Send 10.5 MON to RECEIVER_UID" (public transaction)
- "Send encrypted transaction to RECEIVER_UID" (private, needs encryption data)
- "List my private transactions"
- "Get transaction TXN_UID"

## Safety Constraints

- `sender` must match the authenticated user.
- Amounts must be > 0 and are decimal strings.
- For private transactions, encryption must happen client-side. Do NOT fabricate ciphertext/nonce/keys.
- Always confirm transaction details (recipient + amount) with the user before executing.
- Transactions are irreversible once `success`.
- If the proxy returns `401 reauth_required`, guide the user through re-auth. Do NOT re-auth for any other reason.
