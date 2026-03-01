# TOOLS.md — Notes for Skills

## Environment Setup

The Monad Hack 26 API runs at `$MONAD_API_URL` (default: `http://localhost:3000`).

All authenticated endpoints require a Bearer token in the `Authorization` header.
The bridge session system handles token management server-side once a sessionId is created.

## Required Environment Variables

Set these in `~/.openclaw/.env` or the OpenClaw config:

```
MONAD_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://hqndfsnesfyhxqbksacw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## API Base URL

All skill curl commands use `$MONAD_API_URL` as the base. Make sure the Next.js dev server is running:

```bash
cd /path/to/monad-hack-26
npm run dev
```

## Skill Dependencies

Skills should be used in this order for new users:

1. **auth** — authenticate (OTP send + verify)
2. **bridge** — create session (get sessionId)
3. **users** — create profile (first time only)
4. **friendships** — add friends (needed before transactions)
5. **requests** / **transactions** / **trades** — financial operations

## Notes

- The `trades/execute` endpoint is a stub; it validates but does not settle on-chain.
- Private transactions require client-side encryption (ECDH). The agent cannot generate ciphertext.
- The Telegram/speech endpoints are frontend-only and not exposed as skills.
