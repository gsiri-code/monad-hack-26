# Monad Hack 26 API

Next.js App Router backend using Supabase Postgres.

## Docs

- API endpoints: `docs/backend-endpoints.md`
- Database schema: `docs/db-table-structure.md`

## Environment

Set these server-side variables:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Run

```bash
bun dev
```

## OpenAPI

This project exposes a generated OpenAPI 3.1 document at:

- `GET /api/openapi.json`

The spec is generated from Zod-based contract definitions in:

- `lib/openapi/spec.ts`

## Migrations

Schema files:

- `supabase/migrations/20260228040000_init.sql`
- `supabase/migrations/20260228091000_users_phone_and_friendships.sql`
- `supabase/migrations/20260228120000_private_transactions_ecdh.sql`

Apply migrations:

```bash
supabase db push
```

## Schema

### `users`

Stores account identity and wallet info.

| Column | Type | Constraints |
|---|---|---|
| `uid` | `uuid` | PK, default `gen_random_uuid()` |
| `username` | `text` | NOT NULL, UNIQUE |
| `wallet_address` | `text` | NOT NULL, UNIQUE |
| `encryption_public_key` | `text` | nullable |
| `phone_number` | `text` | nullable, unique when present |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

### `transactions`

Settled transfers between users.

| Column | Type | Constraints |
|---|---|---|
| `uid` | `uuid` | PK, default `gen_random_uuid()` |
| `sender` | `uuid` | NOT NULL, FK -> `users.uid` |
| `receiver` | `uuid` | NOT NULL, FK -> `users.uid` |
| `amount` | `numeric(78,18)` | NOT NULL, `amount > 0` |
| `ts` | `timestamptz` | NOT NULL, default `now()` |
| `status` | `text` | NOT NULL, one of `pending|success|failure` |
| `message` | `text` | nullable |

Table checks and indexes:

- `CHECK (sender <> receiver)`
- `idx_transactions_sender_ts (sender, ts DESC)`
- `idx_transactions_receiver_ts (receiver, ts DESC)`
- `idx_transactions_status_ts (status, ts DESC)`

### `requests`

Payment/trade intent records before settlement.

| Column | Type | Constraints |
|---|---|---|
| `uid` | `uuid` | PK, default `gen_random_uuid()` |
| `sender` | `uuid` | NOT NULL, FK -> `users.uid` |
| `receiver` | `uuid` | NOT NULL, FK -> `users.uid` |
| `amount` | `numeric(78,18)` | NOT NULL, `amount > 0` |
| `ts` | `timestamptz` | NOT NULL, default `now()` |
| `status` | `text` | NOT NULL, one of `open|accepted|rejected|cancelled|expired` |
| `message` | `text` | nullable |

### `private_transactions`

Encrypted direct transfers between users.

| Column | Type | Constraints |
|---|---|---|
| `uid` | `uuid` | PK, default `gen_random_uuid()` |
| `sender` | `uuid` | NOT NULL, FK -> `users.uid` |
| `receiver` | `uuid` | NOT NULL, FK -> `users.uid` |
| `ciphertext` | `text` | NOT NULL |
| `nonce` | `text` | NOT NULL |
| `sender_pubkey_used` | `text` | NOT NULL |
| `ts` | `timestamptz` | NOT NULL, default `now()` |
| `status` | `text` | NOT NULL, one of `pending|success|failure` |

Table checks and indexes:

- `CHECK (sender <> receiver)`
- `idx_requests_sender_ts (sender, ts DESC)`
- `idx_requests_receiver_ts (receiver, ts DESC)`
- `idx_requests_status_ts (status, ts DESC)`

### `friendships`

Undirected friend relation stored in canonical order.

| Column | Type | Constraints |
|---|---|---|
| `uid` | `uuid` | PK, default `gen_random_uuid()` |
| `user_a` | `uuid` | NOT NULL, FK -> `users.uid`, `ON DELETE CASCADE` |
| `user_b` | `uuid` | NOT NULL, FK -> `users.uid`, `ON DELETE CASCADE` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

Table checks and indexes:

- `CHECK (user_a <> user_b)`
- `CHECK (user_a < user_b)`
- `UNIQUE (user_a, user_b)`
- `idx_friendships_user_a_created_at (user_a, created_at DESC)`
- `idx_friendships_user_b_created_at (user_b, created_at DESC)`

## Endpoints

### Users

- `POST /api/users`
  - Body: `{ "username": "alice", "walletAddress": "0x...", "encryptionPublicKey": "0x...", "phoneNumber": "+15551234567", "firstName": "Alice", "lastName": "Lee", "password": "supersecure" }`
  - Creates user.

- `GET /api/users/:uid/wallet`
  - Computes net wallet as successful incoming minus outgoing transaction amounts.

### Friendships

- `POST /api/users/:uid/friendships`
  - Body: `{ "friendUid": "<uid>" }`
  - Creates friendship pair, returns `409` if it already exists.

- `GET /api/users/:uid/friendships?username=<q>&phoneNumber=<q>&limit=<n>`
  - `username`: case-insensitive fuzzy match.
  - `phoneNumber`: normalized case-insensitive partial/exact match.
  - When both are provided, filters use AND semantics.

- `DELETE /api/users/:uid/friendships/:friendUid`
  - Deletes friendship regardless of pair ordering.

### Requests

- `POST /api/requests`
  - Body: `{ "sender": "<uid>", "receiver": "<uid>", "amount": "10.5", "message": "optional" }`
  - Aliases also accepted: `user1` (sender), `user2` (receiver).

- `GET /api/requests?sender=<uid>&receiver=<uid>&status=<status>&limit=<n>`
  - Supported statuses: `open|accepted|rejected|cancelled|expired`.

- `GET /api/requests/:uid`
  - Fetches one request by id.

- `PATCH /api/requests/:uid`
  - Body: `{ "status": "accepted|rejected|cancelled", "message": "optional" }`

### Transactions

- `POST /api/public-transaction/execute`
  - Body: `{ "sender": "<uid>", "receiver": "<uid>", "amount": "10.5", "message": "optional" }`
  - Creates a public transaction directly.

- `POST /api/private-transactions/execute`
  - Body: `{ "sender": "<uid>", "receiver": "<uid>", "ciphertext": "...", "nonce": "...", "senderPublicKeyUsed": "..." }`
  - Creates a private encrypted transaction directly.

- `GET /api/private-transactions?user=<uid>&limit=<n>`
  - Returns private transactions where user is sender or receiver.

- `GET /api/private-transactions/:uid?user=<uid>`
  - Returns one private transaction by id.
