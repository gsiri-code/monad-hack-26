# Web3 Venmo Project Guidelines

## Tech Stack
- **Network:** Monad Testnet (RPC: https://testnet-rpc.monad.xyz, chainId: 10143)
- **Framework:** Hardhat v3 (TypeScript)
- **Libraries:** Mocha, Chai, Ethers.js v6 (DO NOT USE VIEM), OpenZeppelin
- **Privacy Layer:** Unlink SDK (`@unlink-xyz/node` for server-side, `@unlink-xyz/react` for frontend)
- **Unlink Gateway:** https://api.unlink.xyz
- **Native MON Token:** `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`

## Core Rules for Claude
1. **Never use Viem.** Always default to Ethers.js for smart contract interactions and tests.
2. **Verify Before Completion:** Do not mark a task as complete until you have successfully run `npx hardhat compile` or the relevant `npx hardhat test` command.
3. **Incremental Commits:** If a feature works, write a short commit message and commit it before moving to the next step.
4. **Environment Variables:** Always read private keys and RPC URLs from `process.env` via the `dotenv` package. Never hardcode keys.
5. **Manually approve edits.** Always get user approval before writing or editing files.

## Architecture
- **Smart Contract (`Web3VenmoShield.sol`):** Pulls ERC-20 tokens via `transferFrom`, forwards to Unlink pool via `IUnlinkPool` interface, emits `SocialPayment(sender, receiver, memo)` — no amount in event.
- **Unlink Integration:** Deposits happen via SDK (`unlink.deposit()`), not direct contract calls. Contract uses `IUnlinkPool` interface for testability.
- **Mocks for local testing:** `MockUnlinkPool` and `MockERC20` in `contracts/mocks/`.

## Testing Standards
- Tests must strictly validate both the public state (e.g., ERC-20 balance decreases) and the private state (e.g., Unlink SDK shielded balance increases).
- Event logs (`SocialPayment`) must be explicitly asserted to contain no numerical transaction volume data.
- Follow existing `Counter.ts` pattern: top-level `await network.connect()`, `ethers.deployContract()`.
- **Hardhat v3 revert assertion:** Use `.to.be.revert(ethers)` — `.to.be.reverted` is deprecated and will throw an error.

## What Has Been Built

### Contracts (`brian/contracts/`)
- `IUnlinkPool.sol` — Interface with `deposit(token, amount)` and `balanceOf(token, account)`
- `Web3VenmoShield.sol` — Core contract: pulls ERC-20 via `transferFrom`, approves + calls `unlinkPool.deposit()`, emits `SocialPayment(sender, receiver, memo)` (no amount)
- `mocks/MockERC20.sol` — OpenZeppelin ERC20 with mint-on-deploy, used in local tests
- `mocks/MockUnlinkPool.sol` — Implements `IUnlinkPool`, tracks `shieldedBalances[token][account]`

### Tests (`brian/test/`)
- `Web3VenmoShield.ts` — 5 passing tests: ERC-20 balance decreases, shielded balance increases, revert without approval, `SocialPayment` event args, no amount in event logs

### Scripts (`brian/scripts/`)
- `unlink-shield.ts` — Deposits native MON into Unlink shielded pool on Monad testnet via `@unlink-xyz/node`

### Dependencies added to `brian/package.json`
- `@openzeppelin/contracts`
- `@unlink-xyz/node`

## What Needs To Be Done Next
- Deploy `Web3VenmoShield` to Monad testnet (`npx hardhat run scripts/... --network monadTestnet`)
- Run `scripts/unlink-shield.ts` against testnet with a funded wallet (Checkpoint 4)
- Frontend integration using `@unlink-xyz/react` (`UnlinkProvider`, `useUnlink`, `useSend`)