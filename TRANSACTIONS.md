# Transaction Execution Guide

This document describes how transactions are executed in this system, covering both **public trades** (operator-controlled vault) and **private trades** (Unlink smart wallet).

---

## Overview

| Transaction Type | Execution Model | Signing | Auth Mechanism |
|------------------|-----------------|---------|----------------|
| **Public** | Operator-controlled vault (smart contract) | No user signature per trade | `msg.sender == operator` |
| **Private** | Unlink SDK on frontend | ZK proof (no Phantom pop-up) | Cryptographic proof of note ownership |

---

## 1. Public Transactions

### 1.1 Architecture: Operator-Controlled Vault

Public trades execute through a **smart contract vault** that holds user-deposited funds. An authorized **operator** (backend service) can execute trades on behalf of users without requiring a wallet signature for each transaction.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PUBLIC TRANSACTION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User deposits (1x Phantom pop-up)                                      │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐                                                   │
│  │  Vault Contract  │  ◄── Holds tokens (USDC, MON, etc.)              │
│  │  (on-chain)      │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           │  executePublicTrade(...)                                    │
│           │  only callable when msg.sender == operator                  │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │  DEX / Protocol  │     │  Chainlink       │  (exchange rate)          │
│  │  (swap, transfer)│     │  oracle          │                           │
│  └─────────────────┘     └─────────────────┘                           │
│                                                                         │
│  Operator (backend) submits tx with operator's private key               │
│  → No Phantom pop-up for user                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Authentication: `msg.sender == operator`

The vault contract enforces that **only the operator** can trigger trade execution. This is implemented as a simple access control check:

```solidity
address public operator;

modifier onlyOperator() {
    require(msg.sender == operator, "Not authorized: must be operator");
    _;
}

function executePublicTrade(address u1, address u2, uint256 val) external onlyOperator {
    // Execute trade logic (swap, transfer, etc.)
    // Chainlink oracle for exchange rate
}
```

**Critical point:** A transaction can only run if `msg.sender == operator`. The blockchain sets `msg.sender` to the address that signed and submitted the transaction. Therefore:

- Only whoever holds the **operator's private key** can call `executePublicTrade`
- Knowing the contract address or operator address does **not** allow unauthorized execution
- Funds are secure as long as the operator key is protected

### 1.3 How This Differs From ERC-4337 Smart Wallets

| Aspect | Operator-Controlled Vault (This System) | ERC-4337 Smart Wallets |
|--------|----------------------------------------|-------------------------|
| **Per-trade auth** | None. Operator is trusted. | Each `UserOperation` requires a valid signature (user or session key) |
| **Auth check** | `msg.sender == operator` (identity check) | Signature verification inside contract (`validateUserOp`) |
| **Trust model** | Custodial/semi-custodial: operator acts on user's behalf | Non-custodial: user (or delegated key) cryptographically authorizes each action |
| **User signature** | None after initial deposit | Required for every action (or once to create session key, then session key signs) |
| **Gas abstraction** | Custom (operator pays or user funds operator) | Native via paymaster |

**Summary:** Our vault trusts the operator. ERC-4337 smart wallets verify a signature for every action, so no single party is blindly trusted.

### 1.4 Execution Flow (Step-by-Step)

1. **Initial deposit (one-time)**  
   - User approves tokens and transfers to the vault contract.  
   - Phantom pop-up: user signs.  
   - Vault balance increases.

2. **Trade request**  
   - User requests a public trade in the app (e.g., swap, transfer).

3. **Backend builds transaction**  
   - Backend constructs `executePublicTrade(u1, u2, val)` or similar.  
   - Uses Chainlink for exchange rate when needed.

4. **Operator submits transaction**  
   - Backend signs with the operator's private key.  
   - Submits to the chain.  
   - `msg.sender` = operator address → check passes.

5. **Contract executes**  
   - Vault performs the trade (calls DEX, transfers tokens, etc.).  
   - No further user interaction.

### 1.5 Security Considerations

- **Operator key** is the critical secret. If compromised, vault can be drained.
- **Operator key** should be stored securely (KMS, HSM, secrets manager).
- Consider spending limits, time locks, or multisig for high-value vaults.

---

## 2. Private Transactions

### 2.1 Architecture: Unlink Smart Wallet on Frontend

Private trades use **Unlink** — a privacy system where funds live in a shared pool and transfers are proven via zero-knowledge proofs. No Phantom pop-up is required for private sends.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRIVATE TRANSACTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User's Unlink account (unlink1...)                                     │
│  - Created from mnemonic (createWallet → createAccount)                 │
│  - Holds notes (UTXOs) inside Unlink pool                               │
│                                                                         │
│  User clicks "Send" in app                                              │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  Unlink SDK     │     │  Unlink Gateway  │     │  Unlink Pool     │   │
│  │  (frontend)     │ ──► │  (relay)        │ ──► │  (smart contract)│   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│       │                                                                 │
│       │  1. Select notes to spend                                       │
│       │  2. Build output note for recipient (unlink1...)               │
│       │  3. Generate ZK proof                                          │
│       │  4. Submit proof + calldata                                     │
│       │                        5. Verify proof, update Merkle tree      │
│       │                        6. Add recipient's commitment            │
│                                                                         │
│  No Phantom pop-up. SDK uses Unlink keys (from mnemonic).                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 How It Works

1. **Wallet setup**  
   - User runs `createWallet()` → mnemonic.  
   - User runs `createAccount()` → Unlink address `unlink1...`.

2. **Deposit (one Phantom pop-up)**  
   - User deposits from EOA into the Unlink pool.  
   - Notes are created and tied to the user's Unlink account.

3. **Private send (no pop-up)**  
   - User calls `send([{ token, recipient: "unlink1...", amount }])`.  
   - SDK uses spending key to generate a ZK proof.  
   - Proof is sent to Unlink Gateway, which relays to the pool.  
   - Pool verifies proof and updates state.  
   - Sender, recipient, amount, and token are all private.

### 2.3 Integration Points

- **Frontend:** Uses `@unlink-xyz/react` (`UnlinkProvider`, `useUnlink`).
- **Chain:** Monad testnet (chainId `10143`).
- **Pool:** Unlink pool contract holds funds; frontend only interacts via SDK and gateway.

### 2.4 Key Properties

- **No Phantom per trade:** Unlink keys sign; gateway relays.
- **Privacy:** Balances and transfer details are hidden on-chain.
- **Same UX pattern:** Deposit once into the pool, then transact without extra wallet signatures.

---

## 3. Summary Comparison

| | Public Trade | Private Trade |
|---|-------------|--------------|
| **Infrastructure** | Vault contract + operator backend | Unlink pool + SDK + gateway |
| **User signs per trade** | No | No |
| **Auth** | `msg.sender == operator` | ZK proof of note ownership |
| **Privacy** | Transparent on-chain | Amount, parties, token hidden |
| **Exchange rate** | Chainlink oracle | N/A (private) |
| **Entrypoint** | `executePublicTrade(u1, u2, val)` | `send()` from Unlink SDK |

---

## 4. Entrypoint Reference

From `smart_contract.sol`:

- **Public:** `executePublicTrade(address u1, address u2, uint256 val)` — standard flow via operator-controlled vault, Chainlink for rates.
- **Private:** `executePrivateTrade(address u1, address u2, uint256 val)` — frontend via Unlink SDK; Unlink pool and smart contract handle settlement.
