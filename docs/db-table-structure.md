# Database Table Structure

Postgres schema reference for application data tables.

## ER Snapshot

- `users` is the parent entity.
- `transactions.sender` and `transactions.receiver` -> `users.uid`.
- `requests.sender` and `requests.receiver` -> `users.uid`.
- `private_transactions.sender` and `private_transactions.receiver` -> `users.uid`.
- `friendships.user_a` and `friendships.user_b` -> `users.uid`.

---

## `users`

Account identity, profile, auth hash, wallet mapping, and encryption key.

| Column | Type | Null | Default | Constraints / Notes |
|---|---|---|---|---|
| `uid` | `uuid` | no | `gen_random_uuid()` | primary key |
| `username` | `text` | no | - | unique |
| `wallet_address` | `text` | no | - | unique |
| `phone_number` | `text` | no | - | unique (partial index for non-null rows), non-blank check |
| `first_name` | `text` | no | - | non-blank check |
| `last_name` | `text` | no | - | non-blank check |
| `email` | `text` | yes | - | unique on `lower(email)` when present |
| `password_hash` | `text` | no | - | non-blank check |
| `encryption_public_key` | `text` | yes | - | optional ECDH key |
| `created_at` | `timestamptz` | no | `now()` | creation timestamp |

**Indexes**

- `username` unique index
- `wallet_address` unique index
- `idx_users_phone_number_unique` partial unique (`phone_number IS NOT NULL`)
- `idx_users_email_lower_unique` partial unique (`email IS NOT NULL`)
- `idx_users_username_trgm` (GIN trigram on `lower(username)`)
- `idx_users_phone_number_trgm` (GIN trigram on normalized phone)

---

## `transactions`

Public transfer records.

| Column | Type | Null | Default | Constraints / Notes |
|---|---|---|---|---|
| `uid` | `uuid` | no | `gen_random_uuid()` | primary key |
| `sender` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `receiver` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `amount` | `numeric(78,18)` | no | - | `amount > 0` |
| `ts` | `timestamptz` | no | `now()` | event timestamp |
| `status` | `text` | no | - | `pending|success|failure` |
| `message` | `text` | yes | - | optional note |

**Checks**

- `sender <> receiver`

**Indexes**

- `idx_transactions_sender_ts (sender, ts DESC)`
- `idx_transactions_receiver_ts (receiver, ts DESC)`
- `idx_transactions_status_ts (status, ts DESC)`

---

## `requests`

Pre-settlement intent records.

| Column | Type | Null | Default | Constraints / Notes |
|---|---|---|---|---|
| `uid` | `uuid` | no | `gen_random_uuid()` | primary key |
| `sender` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `receiver` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `amount` | `numeric(78,18)` | no | - | `amount > 0` |
| `ts` | `timestamptz` | no | `now()` | event timestamp |
| `status` | `text` | no | - | `open|accepted|rejected|cancelled|expired` |
| `message` | `text` | yes | - | optional note |

**Checks**

- `sender <> receiver`

**Indexes**

- `idx_requests_sender_ts (sender, ts DESC)`
- `idx_requests_receiver_ts (receiver, ts DESC)`
- `idx_requests_status_ts (status, ts DESC)`

---

## `private_transactions`

Encrypted transfer records.

| Column | Type | Null | Default | Constraints / Notes |
|---|---|---|---|---|
| `uid` | `uuid` | no | `gen_random_uuid()` | primary key |
| `sender` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `receiver` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE RESTRICT`) |
| `ciphertext` | `text` | no | - | encrypted payload |
| `nonce` | `text` | no | - | encryption nonce |
| `sender_pubkey_used` | `text` | no | - | sender public key used |
| `ts` | `timestamptz` | no | `now()` | event timestamp |
| `status` | `text` | no | - | `pending|success|failure` |

**Checks**

- `sender <> receiver`

**Indexes**

- `idx_private_transactions_sender_ts (sender, ts DESC)`
- `idx_private_transactions_receiver_ts (receiver, ts DESC)`
- `idx_private_transactions_status_ts (status, ts DESC)`

---

## `friendships`

Undirected friendship edges stored in canonical order.

| Column | Type | Null | Default | Constraints / Notes |
|---|---|---|---|---|
| `uid` | `uuid` | no | `gen_random_uuid()` | primary key |
| `user_a` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE CASCADE`) |
| `user_b` | `uuid` | no | - | FK -> `users.uid` (`ON DELETE CASCADE`) |
| `created_at` | `timestamptz` | no | `now()` | creation timestamp |

**Checks / uniqueness**

- `user_a <> user_b`
- `user_a < user_b` (canonical pair order)
- `UNIQUE (user_a, user_b)`

**Indexes**

- `idx_friendships_user_a_created_at (user_a, created_at DESC)`
- `idx_friendships_user_b_created_at (user_b, created_at DESC)`
