# monad-hack-26

## Dependencies Installed

### Hardhat Backend (`smart-contracts/`)

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
| `@types/chai` | ^5.2.3 | Chai type definitions |
| `@types/chai-as-promised` | ^8.0.2 | Chai-as-promised type definitions |
| `@types/mocha` | ^10.0.10 | Mocha type definitions |
| `@types/node` | ^22.19.13 | Node.js type definitions |
| `forge-std` | v1.9.4 | Foundry standard library (Solidity unit tests) |

### Frontend (`brian/frontend/`)

**Runtime dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `ethers` | ^6.16.0 | Ethereum library for wallet + contract calls |

**Dev dependencies:**

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^7.3.1 | Dev server and bundler |
| `@vitejs/plugin-react` | ^5.1.1 | React fast-refresh for Vite |
| `typescript` | ~5.9.3 | TypeScript compiler |
| `eslint` | ^9.39.1 | Linter |
| `eslint-plugin-react-hooks` | ^7.0.1 | React hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.24 | React refresh lint rules |
| `typescript-eslint` | ^8.48.0 | TypeScript ESLint parser/rules |
| `@eslint/js` | ^9.39.1 | ESLint core JS rules |
| `globals` | ^16.5.0 | Global variable definitions for ESLint |
| `@types/react` | ^19.2.7 | React type definitions |
| `@types/react-dom` | ^19.2.3 | React DOM type definitions |
| `@types/node` | ^24.10.1 | Node.js type definitions |

### Still Needed (not yet installed)

| Package | Where | Purpose |
|---------|-------|---------|
| `@unlink-xyz/react` | `brian/frontend/` | Frontend Unlink SDK (`UnlinkProvider`, `useUnlink`, `useSend`) |
