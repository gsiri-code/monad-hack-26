# Web3 Venmo Project Guidelines

## Tech Stack
- **Network:** Monad Testnet (RPC: https://testnet-rpc.monad.xyz)
- **Framework:** Hardhat v3 (TypeScript)
- **Libraries:** Mocha, Chai, Ethers.js v6 (DO NOT USE VIEM), OpenZeppelin
- **Privacy Layer:** Unlink SDK

## Core Rules for Claude
1. **Never use Viem.** Always default to Ethers.js for smart contract interactions and tests.
2. **Verify Before Completion:** Do not mark a task as complete until you have successfully run `npx hardhat compile` or the relevant `npx hardhat test` command.
3. **Incremental Commits:** If a feature works, write a short commit message and commit it before moving to the next step.
4. **Environment Variables:** Always read private keys and RPC URLs from `process.env` via the `dotenv` package. Never hardcode keys.

## Testing Standards
- Tests must strictly validate both the public state (e.g., ERC-20 balance decreases) and the private state (e.g., Unlink SDK shielded balance increases).
- Event logs (`SocialPayment`) must be explicitly asserted to contain no numerical transaction volume data.