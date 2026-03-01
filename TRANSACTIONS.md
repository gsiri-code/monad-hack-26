# Transaction Execution Guide

This document describes how transactions are executed in this system, covering **public trades** (operator-controlled vault), **private trades** (Unlink smart wallet), and **transfers between public and private** (vault ↔ Unlink).

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

## 3. Public ↔ Private Transfers

Users can move funds between the **public vault** and their **Unlink private address**, enabling privacy when desired or liquidity when needed.

### 3.1 Public → Private (Vault to Unlink)

Move funds from the operator-controlled vault into the Unlink pool, where they become private notes tied to the user's `unlink1...` address.

**Flow:**
1. User has a balance in the vault (linked to their EOA, e.g. `0x...`).
2. User requests: "Move X USDC to my private (Unlink) address."
3. Backend/operator calls a vault function to release funds (e.g. withdraw to user's EOA or directly to Unlink pool).
4. Funds enter the Unlink pool as a deposit; notes are created and attributed to the user's Unlink account (`unlink1...`).
5. User may need one Phantom pop-up if the path goes through their EOA (e.g. vault → EOA → pool), or zero if the vault supports direct deposit to the Unlink pool.

**Use case:** User wants to privatize funds (e.g. before a sensitive transfer or to hide balance).

### 3.2 Private → Public (Unlink to Vault)

Move funds from the Unlink pool (private notes) back into the public vault for transparent trading or withdrawals.

**Flow:**
1. User has notes in the Unlink pool (linked to their `unlink1...` address).
2. User requests: "Withdraw X USDC from my private address to vault."
3. Unlink SDK: user spends notes (ZK proof), withdraws to their EOA or a designated vault address.
4. Funds arrive at the target address (EOA or vault). If EOA, user deposits to vault (one Phantom pop-up); if direct to vault, operator reconciles.
5. Vault balance increases; user can now trade publicly or withdraw.

**Use case:** User wants to exit privacy (e.g. for CEX withdrawal, transparent audit, or DEX trading via vault).

### 3.3 Summary

| Direction | Source | Destination | Signing |
|-----------|--------|-------------|---------|
| **Public → Private** | Vault balance | Unlink pool (`unlink1...`) | Operator (vault); possibly 1× Phantom (deposit) |
| **Private → Public** | Unlink pool notes | Vault balance | Unlink SDK (ZK proof); possibly 1× Phantom (deposit) |

---

## 4. Summary Comparison

| | Public Trade | Private Trade |
|---|-------------|--------------|
| **Infrastructure** | Vault contract + operator backend | Unlink pool + SDK + gateway |
| **User signs per trade** | No | No |
| **Auth** | `msg.sender == operator` | ZK proof of note ownership |
| **Privacy** | Transparent on-chain | Amount, parties, token hidden |
| **Exchange rate** | Chainlink oracle | N/A (private) |
| **Entrypoint** | `executePublicTrade(u1, u2, val)` | `send()` from Unlink SDK |

| | Public → Private | Private → Public |
|---|-----------------|-----------------|
| **Direction** | Vault → Unlink pool | Unlink pool → Vault |
| **Use case** | Privatize funds | Exit to public trading / withdrawal |

---

## 5. ECDH Encryption for Transaction Data

To prevent developers from reading transaction data stored in our database while still allowing both sender and receiver to view their transactions, we use **ECDH (Elliptic Curve Diffie-Hellman)** to derive a shared encryption key. A **single ciphertext** is stored; both parties can decrypt it.

### 5.1 Why ECDH?

ECDH allows the sender and receiver to derive the **same shared secret** from their respective key pairs:

```
Sender:   shared_secret = ECDH(sender_private, receiver_public)
Receiver: shared_secret = ECDH(receiver_private, sender_public)
```

Both produce the same value. We encrypt once with a key derived from this shared secret; both parties can decrypt.

### 5.2 Key Derivation Flow

1. **Key exchange:** Sender and receiver each have a key pair (from their wallet: Phantom, MetaMask, etc.). At transfer time, the sender knows the receiver's public key (e.g., from a prior connection, a registry, or the transfer context).
2. **Shared secret:** 
   - Sender: `shared_secret = ECDH(sender_private, receiver_public)`
   - Receiver: `shared_secret = ECDH(receiver_private, sender_public)`
3. **Symmetric key:** `key = HKDF(shared_secret, info = sender_pub || receiver_pub)` — include both public keys in the KDF so the key is bound to the two parties.
4. **Encryption:** Use AES-GCM (or another AEAD) with this key.

### 5.3 Session Key (Avoiding Repeated Wallet Pop-ups)

Wallets like Phantom and MetaMask do **not** expose the raw private key or an ECDH API to dapps. To derive ECDH key material, the client must interact with the wallet (e.g., sign a message) — which triggers a **Phantom pop-up** each time.

To avoid a pop-up for every decrypt, we use a **session key**:

1. **First decrypt in a session:** User approves the wallet interaction (Phantom pop-up).
2. **Derive and cache:** Client derives the ECDH shared secret and symmetric key, then caches it in memory (or `sessionStorage`) for the duration of the session.
3. **Subsequent decrypts:** Use the cached key — no further pop-ups until the session ends.
4. **Session end:** Clear the session key when the user disconnects or the tab closes.

The session key is the cached ECDH-derived symmetric key. One approval per session instead of one per transaction.

### 5.4 Encrypt Before Storing

Transaction data (amount, token, recipient, timestamp, etc.) is **encrypted on the client** before being sent to the backend. The database stores only **one ciphertext** per transaction. (Note: The sender may need a Phantom pop-up to derive the ECDH key at encrypt time; a session key can cache this to avoid repeated pop-ups when viewing multiple outbound transactions.)

**Flow:**
1. Sender has `(sender_priv, sender_pub)`, receiver's `receiver_pub` is available (e.g., from recipient address lookup).
2. Sender computes `shared_secret = ECDH(sender_priv, receiver_pub)` and `key = HKDF(shared_secret, sender_pub || receiver_pub)`.
3. Sender encrypts the payload: `ciphertext = AES-GCM-Encrypt(plaintext, key)`.
4. Store the single `ciphertext` plus `sender_pub` and `receiver_pub` (public keys are not secret; needed for the receiver to derive the same key).

### 5.5 How Sender and Receiver Decrypt Transaction Data

When a user views their transaction history, they fetch the ciphertext and decrypt it on the client using their key pair.

**Sender flow:**
1. User connects wallet and requests transaction history.
2. Backend returns the ciphertext plus `sender_pub` and `receiver_pub` for each transaction where this address is the sender.
3. Client computes: `shared_secret = ECDH(sender_priv, receiver_pub)` → `key = HKDF(shared_secret, sender_pub || receiver_pub)`.
4. Client decrypts: `plaintext = AES-GCM-Decrypt(ciphertext, key)`.
5. Display plaintext (amount, recipient, token, timestamp, etc.) to the user.

**Receiver flow:**
1. User connects wallet and requests transaction history.
2. Backend returns the ciphertext plus `sender_pub` and `receiver_pub` for each transaction where this address is the receiver.
3. Client computes: `shared_secret = ECDH(receiver_priv, sender_pub)` → `key = HKDF(shared_secret, sender_pub || receiver_pub)`.
4. Client decrypts: `plaintext = AES-GCM-Decrypt(ciphertext, key)`.
5. Display plaintext (amount, sender, token, timestamp, etc.) to the user.

**Key point:** Both sender and receiver derive the **same key** from ECDH, so a **single ciphertext** works for both. The derived key never leaves the client; decryption happens entirely in the browser. Use a **session key** (cached derived key) to avoid a Phantom pop-up for every decrypt — see §5.3.

### 5.6 Summary

| | |
|---|------|
| **Mechanism** | ECDH shared secret + HKDF + AES-GCM. |
| **Ciphertexts stored** | One per transaction (instead of two). |
| **Session key** | Cached ECDH-derived key per session; avoids repeated Phantom pop-ups. Cleared on disconnect/close. |
| **Where key is derived** | Client only. Never sent to server or stored in DB. |
| **Who can decrypt** | Both sender and receiver, using their respective private keys. |
| **Developer access** | Developers see only ciphertext and public keys in the database. |

### 5.7 Database Schema

```
| sender    | receiver  | ciphertext |
|-----------|-----------|------------|
| 0x...     | 0x...     | <encrypted>|
```

---

## 6. Entrypoint Reference

From `smart_contract.sol`:

- **Public:** `executePublicTrade(address u1, address u2, uint256 val)` — standard flow via operator-controlled vault, Chainlink for rates.
- **Private:** `executePrivateTrade(address u1, address u2, uint256 val)` — frontend via Unlink SDK; Unlink pool and smart contract handle settlement.
