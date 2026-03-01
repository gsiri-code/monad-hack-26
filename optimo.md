# optimo/ — Benmo Full-Stack App

## What Is This

`optimo/` is the full-stack Next.js 15 web application for Benmo — a privacy-preserving payment app built on Monad Testnet using the Unlink SDK. It pairs with the existing `smart-contracts/` Hardhat project which hosts the `Web3VenmoShield` contract.

The core privacy guarantee: **amounts are never stored, logged, or displayed**. Users see who paid whom and what for — never how much. Transaction values are mathematically shielded on-chain via Unlink's zero-knowledge proof system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Blockchain (client) | `@unlink-xyz/react` |
| Blockchain (server) | `@unlink-xyz/node` |
| Database | Supabase / PostgreSQL |
| Chain | Monad Testnet (Chain ID: 10143) |
| Type safety | TypeScript (ES2020 target) |

**Note:** Ethers.js v6 is included as a dependency. Viem is deliberately excluded.

---

## Directory Structure

```
optimo/
├── package.json                     # Dependencies (no viem)
├── tsconfig.json                    # ES2020 target (required for BigInt literals)
├── next.config.ts                   # Loads .env from repo root
├── postcss.config.mjs               # Tailwind v4 PostCSS
│
├── app/
│   ├── globals.css                  # @import "tailwindcss"
│   ├── layout.tsx                   # Root layout: wraps children in <Providers>
│   ├── providers.tsx                # "use client" — <UnlinkProvider chain="monad-testnet">
│   ├── page.tsx                     # Landing page: links to /onboarding and /dashboard
│   │
│   ├── onboarding/
│   │   └── page.tsx                 # Wallet creation flow (see Step 3)
│   │
│   ├── dashboard/
│   │   ├── page.tsx                 # Main dashboard layout
│   │   └── components/
│   │       ├── SocialFeed.tsx       # Public feed from Supabase
│   │       ├── BalanceSidebar.tsx   # Private shielded balances
│   │       ├── PaymentModal.tsx     # Send payment via useSend()
│   │       └── FriendsList.tsx      # Friend management CRUD
│   │
│   └── api/
│       ├── users/route.ts           # GET + POST user profiles
│       ├── friends/route.ts         # GET + POST friend relationships
│       ├── social-feed/route.ts     # GET + POST payment metadata (no amount)
│       └── bot/route.ts             # POST webhook for OpenClaw Telegram bot
│
├── lib/
│   ├── constants.ts                 # Chain config, token addresses
│   ├── supabase.ts                  # Browser client + server client
│   └── unlink-server.ts             # Lazy singleton for @unlink-xyz/node
│
└── supabase/
    └── schema.sql                   # DDL: users, friends, social_feed tables
```

---

## What Was Built (Step by Step)

### Step 1: Monorepo Setup

Initialized a Next.js 15 project inside `optimo/` with:

- **`package.json`** — dependencies: `next`, `react`, `@unlink-xyz/react`, `@unlink-xyz/node`, `@supabase/supabase-js`, `ethers@6`, `tailwindcss@4`. No viem anywhere.
- **`tsconfig.json`** — `target: "ES2020"` (required for BigInt literal syntax like `5_000_000n`)
- **`next.config.ts`** — loads `.env` from the repo root (`../` relative to `optimo/`) using `dotenv` + `path.resolve`, so all existing env vars are available without duplication.
- **`postcss.config.mjs`** — Tailwind v4 via `@tailwindcss/postcss` plugin.
- **`app/globals.css`** — single `@import "tailwindcss"` line (Tailwind v4 style).
- **`app/layout.tsx`** — root layout that imports global CSS and wraps everything in `<Providers>`.
- **`app/providers.tsx`** — `"use client"` wrapper around `<UnlinkProvider chain="monad-testnet">`. This is where the Unlink SDK initializes for the browser session.
- **`app/page.tsx`** — landing page with "Get Started" → `/onboarding` and "Dashboard" → `/dashboard`.

**Verification:** `npm run dev` starts at `localhost:3000`, returns HTTP 200.

---

### Step 2: Database Schema

**`supabase/schema.sql`** — run this in the Supabase SQL Editor to create three tables:

```sql
-- Maps wallet addresses to display names
CREATE TABLE users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address  TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Bidirectional friend relationships
CREATE TABLE friends (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Payment metadata — NO amount column (privacy by design)
CREATE TABLE social_feed (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender     TEXT NOT NULL,
  receiver   TEXT NOT NULL,
  memo       TEXT NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  tx_hash    TEXT,
  relay_id   TEXT,          -- Unlink relay ID for status tracking
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**`lib/supabase.ts`** exports two clients:
- `supabase` — browser client using the anon key (respects Row Level Security)
- `createServerClient()` — server client using the service role key (for API routes only, bypasses RLS)

The env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are already in the repo root `.env` and loaded automatically via `next.config.ts`.

---

### Step 3: Web Client Auth & Onboarding

**`lib/constants.ts`** — single source of truth for chain config:
```ts
export const MONAD_CHAIN_ID = 10143;
export const MONAD_RPC    = "https://testnet-rpc.monad.xyz";
export const MON_TOKEN    = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const USDC_MONAD   = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
```

**`app/onboarding/page.tsx`** — three-step onboarding flow:
1. User enters a display name
2. Calls `createWallet()` + `createAccount()` from `useUnlink()` — creates a ZK shielded wallet via Unlink
3. POSTs `{ wallet_address, display_name }` to `/api/users` to persist the profile
4. Redirects to `/dashboard`

If the user already has an `activeAccount` (existing session), they skip straight to the dashboard.

**`app/api/users/route.ts`**:
- `POST` — upserts a user row by `wallet_address` (idempotent; safe to call multiple times)
- `GET ?wallet=0x...` — fetches a user's profile

---

### Step 4: Backend Unlink Integration

**`lib/unlink-server.ts`** — lazy singleton for the Node.js Unlink SDK:
```ts
let instance = null;
export async function getUnlink() {
  if (!instance) instance = await initUnlink({ chain: "monad-testnet" });
  return instance;
}
```
This avoids re-initializing the SDK (which is expensive — it loads ZK proof artifacts) on every API route invocation.

**`app/api/bot/route.ts`** — POST endpoint for the OpenClaw Telegram bot webhook:

Payload format:
```json
{
  "sender": "unlink1...",
  "receiver": "unlink1...",
  "amount": 5.0,
  "token": "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  "tokenDecimals": 6,
  "memo": "dinner split",
  "visibility": "public"
}
```

What it does:
1. Converts `amount` (float) to `bigint` with correct decimals: `BigInt(Math.round(amount * 10 ** tokenDecimals))`
2. Calls `unlink.send({ transfers: [{ token, recipient, amount: rawAmount }] })` — this executes a fully private ZK transfer
3. Saves social metadata (sender, receiver, memo, relay_id) to `social_feed` — **amount is discarded and never stored**
4. Returns `{ ok: true, relayId, feed }`

---

### Step 5: Payment UI & API Routing

**`app/dashboard/components/PaymentModal.tsx`** — modal dialog for sending payments:
- Inputs: recipient Unlink address (`unlink1...`), USDC amount, memo text, visibility toggle (Public / Friends / Private)
- On submit: converts amount to bigint, calls `send([{ token, recipient, amount }])` from `useUnlink()`
- On success: POSTs only `{ sender, receiver, memo, relay_id, visibility }` to `/api/social-feed` (no amount in payload)
- Closes after 1.2 seconds and triggers a feed refresh via `onSuccess()` callback

**`app/api/social-feed/route.ts`**:
- `GET` — returns the 50 most recent feed entries, ordered by `created_at DESC`
  - `?wallet=0x...` — filters to entries where sender or receiver matches
  - `?visibility=public` (default) — filters by visibility level
- `POST` — inserts a new feed entry; validates `sender`, `receiver`, `memo` are present; no amount field accepted

**`app/api/friends/route.ts`**:
- `GET ?wallet=0x...` — resolves the user's UUID from their wallet address, then returns their friends list with display names
- `POST { user_wallet, friend_wallet }` — looks up both users by wallet address and inserts the friendship row

---

### Step 6: Social Feed & Dashboard UI

**`app/dashboard/page.tsx`** — main layout:
- Checks `ready` and `activeAccount` from `useUnlink()`; redirects to `/onboarding` if no wallet
- Two-column layout: feed (flex-1) + sidebar (w-72)
- "Pay" button opens `<PaymentModal>`; `onSuccess` increments a `feedKey` to force `<SocialFeed>` to re-fetch

**`app/dashboard/components/SocialFeed.tsx`** — fetches `/api/social-feed` on mount, renders cards:
```
0xabcd...ef12 paid 0x1234...5678 — dinner split
public · Feb 28, 2026
```
No amount is ever shown. Cards display short wallet addresses (first 6 + last 4 chars).

**`app/dashboard/components/BalanceSidebar.tsx`** — reads `balances` from `useUnlink()`:
```ts
const { balances } = useUnlink();
const monBalance  = balances?.[MON_TOKEN]  ?? 0n;
const usdcBalance = balances?.[USDC_MONAD] ?? 0n;
```
Formats bigint → human-readable string with 4 decimal places. The sidebar includes a note: "Only you can see this." These balances are fetched directly from the Unlink ZK state — they are never sent to the server.

**`app/dashboard/components/FriendsList.tsx`** — sidebar panel for managing friends:
- Loads friends from `/api/friends?wallet=activeAccount.address` on mount
- Input + "Add" button to add a new friend by wallet address via `POST /api/friends`
- Displays avatar initials, display name, and truncated wallet address

---

## Critical SDK Details

These types were discovered by reading the actual SDK type declarations — the docs are sometimes out of date.

### `@unlink-xyz/node` — `unlink.send()`

```ts
type SimpleSendParams = {
  transfers: Array<{
    token: string;
    recipient: string;  // bech32m Unlink address: "unlink1..."
    amount: bigint;     // raw units (USDC = 6 decimals, MON = 18 decimals)
  }>;
};
```

### `@unlink-xyz/react` — `useUnlink().send()`

```ts
type SendInput = {
  token: string;
  recipient: string;   // bech32m Unlink address: "unlink1..."
  amount: bigint;
};
// called as: send([{ token, recipient, amount }])
```

**Important:** The `recipient` field must be a Unlink-format address (`unlink1...`), not a standard Ethereum `0x` address. Users need a Unlink address to receive private transfers.

---

## Environment Variables

All vars live in the repo root `.env` and are loaded automatically:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client (public, RLS-gated) |
| `SUPABASE_URL` | Server Supabase client (API routes) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Supabase client (bypasses RLS) |
| `MONAD_PRIVATE_KEY` | Node.js Unlink wallet seed (for bot API route) |

---

## How to Deploy

### 1. Run the Supabase schema

In the [Supabase SQL Editor](https://supabase.com/dashboard/project/hqndfsnesfyhxqbksacw/sql/new), paste `optimo/supabase/schema.sql` and click Run.

### 2. Run locally

```bash
cd optimo
npm run dev   # http://localhost:3000
```

### 3. Deploy to Vercel

```bash
cd optimo
npx vercel --prod
```

Add the five env vars listed above in the Vercel project settings. Vercel auto-detects Next.js.

### 4. Configure the bot webhook

Point your OpenClaw Telegram bot at:
```
POST https://your-app.vercel.app/api/bot
```

---

## User Flow

```
/                 Landing page
  └─ /onboarding  Enter name → createWallet() → createAccount() → save to Supabase
       └─ /dashboard
            ├─ SocialFeed       Shows sender, receiver, memo — NO amounts
            ├─ BalanceSidebar   Shows private shielded balances (MON, USDC)
            ├─ FriendsList      Add/view friends by wallet address
            └─ PaymentModal     Enter recipient + amount + memo → private ZK transfer
                                → saves metadata to social_feed (no amount)
```

---

## Relationship to `smart-contracts/`

The `optimo/` app does **not** call `Web3VenmoShield.sol` directly. The contract exists for use cases where you need on-chain composability (e.g., a DeFi protocol triggering a payment). The web app uses the Unlink SDK directly:

- **Frontend payments:** `useSend()` hook → Unlink ZK transfer
- **Bot payments:** `unlink.send()` server-side → Unlink ZK transfer
- **Social metadata:** both paths → `POST /api/social-feed` → Supabase

The `SocialPayment(sender, receiver, memo)` event from the contract and the `social_feed` table rows share the same privacy model: sender, receiver, memo are visible — amount is never recorded.
