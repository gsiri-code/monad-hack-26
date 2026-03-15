# Unlink SDK Documentation Context

## Overview
Unlink enables private blockchain wallets on EVM (currently on Monad Testnet). It uses zero-knowledge proofs to allow users to own accounts, send/receive tokens, and interact with smart contracts without exposing balances or transaction history.

**Privacy Matrix:**
* **Deposit (Public -> Private):** Amount, Sender, Token are Public. Recipient is Private.
* **Transfer (Private -> Private):** Amount, Sender, Recipient, Token are all Private.
* **Withdraw (Private -> Public):** Amount, Recipient, Token are Public. Sender is Private.

## Configuration & Networks
* **Network:** Monad Testnet (`chain: "monad-testnet"`)
* **Chain ID:** 10143
* **Gateway:** `https://api.unlink.xyz`
* **Native Token (MON):** `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

## Core Packages
1.  `@unlink-xyz/react`: React hooks (`useUnlink`, `useSend`, etc.) and `UnlinkProvider`.
2.  `@unlink-xyz/node`: Server-side and script integration (`initUnlink`).
3.  `@unlink-xyz/cli`: Terminal management (`unlink-cli`).
4.  `@unlink-xyz/multisig`: FROST-based threshold wallets.
5.  `@unlink-xyz/core`: Low-level API reference and utilities.

## React SDK Integration
**Setup:** Wrap app in `<UnlinkProvider chain="monad-testnet">`
**Primary Hook:** `useUnlink()` exposes state (`ready`, `balances`, `activeAccount`) and actions (`createWallet`, `send`, `deposit`, `withdraw`, `waitForConfirmation`).
**Mutation Hooks:** `useDeposit`, `useSend`, `useWithdraw`, `useInteract`.

## Node.js SDK Integration
**Setup:** `const unlink = await initUnlink({ chain: "monad-testnet" });`
**Core Methods:** `unlink.send()`, `unlink.deposit()`, `unlink.withdraw()`.
**Status Tracking:** `await waitForConfirmation(unlink, result.relayId);`

## Advanced Features

### Multisig (Threshold Wallets)
Uses FROST (m-of-n) EdDSA signatures. Cryptographically identical to standard single-signer transactions on-chain.
* **DKG (Distributed Key Generation):** Creator uses `createMultisig()`, co-signers use `joinMultisig()`.
* **Signing:** Initiator creates a session; co-signers use a background listener (`runSigningListener`) to auto-approve or manually sign (`signMultisig`).

### Private DeFi (Atomic)
Executes interactions via the `UnlinkAdapter` contract in a single atomic transaction: Unshield -> Execute -> Reshield.
* **Utilities:** `buildCall`, `approve`, `contract`.
* **Execution:** `unlink.interact({ spend, calls, receive })` or `useInteract()` in React.
* **Constraint:** The swap/interaction recipient MUST be `unlink.adapter.address`.

### Burner Accounts (Stateful DeFi)
BIP-44 derived ephemeral EOAs funded from the shielded pool for multi-step DeFi (LPs, Staking).
* **Flow:** Derive (`addressOf`) -> Fund (`fund`) -> Use (`send`) -> Sweep back to pool (`sweepToPool`).