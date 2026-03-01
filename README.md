# Monad Hack 26

Next.js App Router frontend/backend using Supabase Postgres, with a Hardhat smart contract backend.

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

## Dependencies

### Hardhat Backend (`brian/`)

**Runtime dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@openzeppelin/contracts` | ^5.6.1 | ERC-20 interfaces (`IERC20`) used by `Web3VenmoShield` |
| `@unlink-xyz/node` | ^0.1.8 | Server-side Unlink SDK — deposit, withdraw, sync, getBalance |
| `dotenv` | ^17.3.1 | Load `.env` vars (private keys, RPC URLs) |

**Dev dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `hardhat` | ^3.1.10 | Build framework (compile, test, deploy) |
| `ethers` | ^6.16.0 | Ethereum library for contract interaction |
| `@nomicfoundation/hardhat-ethers` | ^4.0.5 | Hardhat–ethers integration plugin |
| `@nomicfoundation/hardhat-toolbox-mocha-ethers` | ^3.0.3 | Bundled Hardhat toolbox (chai matchers, gas reporter, etc.) |
| `@nomicfoundation/hardhat-ignition` | ^3.0.8 | Deployment framework |
| `mocha` | ^11.7.5 | Test runner |
| `chai` | ^6.2.2 | Assertion library |
| `typescript` | ~5.8.0 | TypeScript compiler |

### Still Needed

| Package | Where | Purpose |
|---------|-------|---------|
| `@unlink-xyz/react` | frontend | Frontend Unlink SDK (`UnlinkProvider`, `useUnlink`, `useSend`) |
