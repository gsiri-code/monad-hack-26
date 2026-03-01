# Backend Endpoints Reference

Concise reference for all backend routes in this project.

- Base path: `/api`
- Content type: `application/json`
- Auth: no route-level auth is enforced in current handlers

## Users

### `POST /api/users`

Create a user account.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | unique |
| `walletAddress` | string | yes | unique |
| `phoneNumber` | string | yes | unique |
| `firstName` | string | yes | non-empty |
| `lastName` | string | yes | non-empty |
| `password` | string | yes | min 8 chars; stored as argon2 hash |
| `encryptionPublicKey` | string | no | used for private tx |
| `email` | string | no | unique (case-insensitive) when present |

**Response**

- `201 Created` with `{ user: { ... } }`
- `400 Bad Request` invalid/missing fields
- `409 Conflict` unique field already exists

### `GET /api/users/:uid/wallet`

Return net wallet balance from successful public transactions.

- Formula: `sum(incoming success tx) - sum(outgoing success tx)`
- Response shape: `{ uid, wallet: [{ currencyName: "MON", amount: "..." }] }`

---

## Friendships

### `POST /api/users/:uid/friendships`

Create a friendship link between two users.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `friendUid` | string (UUID) | yes | cannot equal `uid` |

**Response**

- `201 Created` with `{ friendship: { uid, userA, userB, createdAt } }`
- `400 Bad Request` invalid UUID / self-friend
- `404 Not Found` one or both users missing
- `409 Conflict` friendship already exists

### `GET /api/users/:uid/friendships?username=&phoneNumber=&limit=`

List friendships for a user, with optional friend search filters.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `username` | string | no | fuzzy + partial match |
| `phoneNumber` | string | no | normalized partial match |
| `limit` | number | no | defaults to 50, clamped 1-200 |

**Response**

- `200 OK` with `{ friendships: [...] }`

### `DELETE /api/users/:uid/friendships/:friendUid`

Delete a friendship regardless of pair ordering.

**Response**

- `200 OK` with deleted friendship payload
- `400 Bad Request` invalid UUIDs / same user
- `404 Not Found` friendship does not exist

---

## Requests

### `POST /api/requests`

Create a request record (intent before settlement).

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `sender` or `user1` | string | yes | aliases supported |
| `receiver` or `user2` | string | yes | aliases supported |
| `amount` | number or string | yes | must be positive |
| `message` | string or null | no | optional |

**Response**

- `201 Created` with `{ uid, time, status }` (`status` starts as `open`)

### `GET /api/requests?sender=&receiver=&status=&limit=`

List request records.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `sender` | string | no | filter exact |
| `receiver` | string | no | filter exact |
| `status` | string | no | `open|accepted|rejected|cancelled|expired` |
| `limit` | number | no | defaults to 50, clamped 1-200 |

### `GET /api/requests/:uid`

Fetch one request by ID.

### `PATCH /api/requests/:uid`

Update request status.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | yes | `accepted|rejected|cancelled` |
| `message` | string or null | no | optional update |

---

## Transactions

### `POST /api/public-transaction/execute`

Create a public transaction directly.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `sender` or `user1` | string | yes | aliases supported |
| `receiver` or `user2` | string | yes | aliases supported |
| `amount` | number or string | yes | must be positive |
| `status` | string | no | defaults to `success`; allowed `pending|success|failure` |
| `message` | string or null | no | optional |

**Response**

- `200 OK` with `{ uid, time, status, sender, receiver, type: "public" }`

### `POST /api/private-transactions/execute`

Create a private encrypted transaction directly.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `sender` or `user1` | string | yes | aliases supported |
| `receiver` or `user2` | string | yes | aliases supported |
| `ciphertext` or `payloadCiphertext` | string | yes | encrypted payload |
| `nonce` or `payloadNonce` | string | yes | encryption nonce |
| `senderPublicKeyUsed` or `senderPubkeyUsed` | string | yes | key metadata |
| `status` | string | no | defaults to `success`; allowed `pending|success|failure` |

**Response**

- `200 OK` with `{ uid, time, status, sender, receiver, type: "private" }`

### `GET /api/private-transactions?sender=&receiver=&user=&status=&limit=`

List private transactions.

**Query params**

| Param | Type | Required | Notes |
|---|---|---|---|
| `sender` | string | conditionally | at least one of `sender`, `receiver`, `user` is required |
| `receiver` | string | conditionally | at least one of `sender`, `receiver`, `user` is required |
| `user` | string | conditionally | matches sender OR receiver |
| `status` | string | no | `pending|success|failure` |
| `limit` | number | no | defaults to 50, clamped 1-200 |

### `GET /api/private-transactions/:uid?user=`

Fetch one private transaction by ID.

- Optional `user` query param enforces membership check (`sender` or `receiver`)

---

## Trades

### `POST /api/trades/execute`

Stub endpoint; does not execute settlement yet.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `requestId` or `requestID` | string | yes | request reference |

**Current behavior**

- Always returns `200 OK` with `status: "failure"`
- Message explicitly states trade execution is not implemented
