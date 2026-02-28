# Backend API Skeleton (Next.js + Supabase)

This project now includes a backend API skeleton built with Next.js route handlers and Supabase Postgres.

## Environment Variables

Create `.env.local` with:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Run Locally

```bash
bun dev
```

## Supabase Migration

Schema migration is included at `supabase/migrations/20260228040000_init.sql`.

Apply migrations with your usual Supabase workflow (`supabase db push`, etc.).

## API Endpoints

- `POST /api/users`
  - Body: `{ "username": "alice", "walletAddress": "0x..." }`
- `POST /api/requests`
  - Body: `{ "sender": "<uid>", "receiver": "<uid>", "amount": "10.5", "message": "optional" }`
  - Backward-compatible aliases also accepted in body: `user1`, `user2`
- `GET /api/requests?sender=<uid>&receiver=<uid>&status=open&limit=50`
- `GET /api/requests/:uid`
- `PATCH /api/requests/:uid`
  - Body: `{ "status": "accepted|rejected|cancelled", "message": "optional" }`
- `GET /api/users/:uid/wallet`
  - Computes a net balance from successful transactions and returns one currency entry.
- `POST /api/trades/execute`
  - Stub endpoint for now. Body: `{ "requestId": "<uid>" }`

## Supabase Type Generation

Generate DB types from your schema when needed:

```bash
supabase gen types typescript --linked --schema public > lib/db/database.types.ts
```
