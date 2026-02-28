# Gas Fee Handling

This document describes how gas fees are abstracted so users can transact using only USDC, without holding the native Monad token (MON).

---

## 1. The Problem

| User holds | Gas requires |
|------------|--------------|
| USDC (primary transaction currency) | MON (native token on Monad) |

Users do not want to manage two currencies. Gas must be paid in MON on-chain, but we want to charge users in USDC.

---

## 2. Solution Overview

**Gas abstraction:** User pays in USDC; the developer pays actual gas in MON.

```
User pays (USDC)     →  Deducted from vault balance
Developer pays (MON) →  Operator submits tx, pays gas from MON treasury
```

---

## 3. MVP: Fixed Gas Fee

### 3.1 Configuration

| Parameter | Value |
|----------|-------|
| Gas fee charged to user | $0.0025 USDC (fixed) |
| Gas paid by | Developer (operator) |
| Source of developer MON | Internal treasury contract or EOA |

### 3.2 Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GAS FEE FLOW (MVP)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User's vault                                                           │
│  ┌─────────────────────┐                                                 │
│  │  USDC balance       │                                                 │
│  │  (user's portion)   │                                                 │
│  └─────────┬───────────┘                                                 │
│            │                                                             │
│            │  executePublicTrade()                                      │
│            │  ┌──────────────────────────────────────┐                   │
│            │  │ 1. Deduct $0.0025 USDC → developer   │                   │
│            │  │ 2. Execute trade (swap/transfer)     │                   │
│            │  └──────────────────────────────────────┘                   │
│            │                                                             │
│            ▼                                                             │
│  Developer receives USDC                                                 │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Developer's treasury                                                   │
│  ┌─────────────────────┐                                                 │
│  │  MON balance        │  ◄── Funds operator EOA                         │
│  │  (internal contract│      to pay gas for each tx                    │
│  │   or EOA)           │                                                 │
│  └─────────┬───────────┘                                                 │
│            │                                                             │
│            │  Operator submits tx                                       │
│            │  msg.sender pays gas in MON                                │
│            ▼                                                             │
│  Transaction executes on-chain                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 User Experience

1. User deposits USDC only into the vault.
2. User never needs MON.
3. Each trade costs $0.0025 USDC; deducted automatically from their vault balance.
4. No wallet pop-up for gas; no need to hold native token.

### 3.4 Preconditions

- User's vault USDC balance must cover: `trade amount + $0.0025` (or equivalent in smallest units).
- Operator EOA must hold sufficient MON to pay gas for each transaction.
- Developer treasury is topped up periodically with MON.

### 3.5 Contract Logic (Pseudocode)

```solidity
uint256 public constant GAS_FEE_USDC = 2500; // $0.0025 with 6 decimals

function executePublicTrade(address user, address u1, address u2, uint256 val) external onlyOperator {
    uint256 totalRequired = _tradeAmount(val) + GAS_FEE_USDC;
    require(balances[user] >= totalRequired, "Insufficient balance (trade + gas fee)");

    // 1. Collect gas fee in USDC
    balances[user] -= GAS_FEE_USDC;
    IERC20(USDC).transfer(developerAddress, GAS_FEE_USDC);

    // 2. Execute trade (operator pays gas in MON when submitting this tx)
    _doTrade(u1, u2, val);
}
```

### 3.6 Trade-offs

| MON price | Effect |
|-----------|--------|
| Rises | Your MON cost increases; $0.0025 may not cover it |
| Falls | You may overcharge relative to actual cost |

For MVP, fixed fee is acceptable; adjust as needed based on network conditions.

---

## 4. Future: Dynamic Gas Pricing (Chainlink)

### 4.1 Goal

Charge the user the actual cost of gas (in USDC) based on current MON price and gas usage.

### 4.2 Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DYNAMIC GAS FEE FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Estimate gas for trade (e.g. 150,000 gas)                           │
│  2. Get current gas price (from chain or oracle)                         │
│  3. gasCostMON = gasLimit × gasPrice                                     │
│  4. Fetch MON/USD from Chainlink                                        │
│  5. gasCostUSDC = gasCostMON × monoPerUsd                                 │
│  6. feeUSDC = gasCostUSDC + buffer (e.g. 10%)                            │
│  7. Deduct feeUSDC from user; operator pays gas in MON                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Contract Logic (Pseudocode)

```solidity
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

AggregatorV3Interface public monoUsdFeed;

function getGasFeeInUSDC(uint256 gasLimit) public view returns (uint256) {
    uint256 gasPrice = tx.gasprice; // or block.basefee + priority
    uint256 gasCostMON = gasLimit * gasPrice;
    (, int256 monoPerUsd,,,) = monoUsdFeed.latestRoundData();
    // gasCostUSDC = gasCostMON / (MON per 1 USD)
    return (gasCostMON * 1e6) / uint256(monoPerUsd);
}

function executePublicTrade(...) external onlyOperator {
    uint256 gasLimit = 200_000; // estimate
    uint256 feeUSDC = getGasFeeInUSDC(gasLimit);
    uint256 buffer = (feeUSDC * 10) / 100; // 10% buffer
    uint256 totalFee = feeUSDC + buffer;

    balances[user] -= totalFee;
    IERC20(USDC).transfer(developerAddress, totalFee);

    _doTrade(u1, u2, val);
}
```

### 4.4 Chainlink Requirements

- MON/USD (or equivalent) price feed on Monad.
- Verify feed exists and is configured for your network before implementing.

---

## 5. Internal Treasury (Developer MON Storage)

### 5.1 Options

| Option | Description |
|--------|-------------|
| **EOA** | Simple; operator EOA holds MON. Top up manually or via script. |
| **Treasury contract** | Contract holds MON; owner withdraws to operator as needed. |
| **Automated funding** | Contract or script sends MON from treasury to operator based on balance. |

### 5.2 Minimal Setup

```
Developer EOA or Treasury Contract
    │
    │  Holds MON
    │
    ▼
Operator EOA
    │
    │  Submits transactions (executePublicTrade)
    │  Pays gas from its MON balance
    │
    ▼
  Chain
```

- Operator must always have enough MON to cover the next batch of transactions.
- Set up alerts or automation to refill when balance is low.

---

## 6. User Approval

Users approve fee deduction by using the service:

- Terms of service specify the fee structure.
- One-time approval at deposit: user agrees vault may deduct gas fees.
- Contract enforces: balance check and transfer at execution time.

No additional signature is required per transaction; the vault already holds user funds and has logic to deduct fees.

---

## 7. Summary

| Phase | Fee model | User pays | Developer pays | Pricing |
|-------|-----------|-----------|----------------|---------|
| **MVP** | Fixed | $0.0025 USDC per trade | MON (gas) | Fixed |
| **Future** | Dynamic | Actual cost + buffer | MON (gas) | Chainlink MON/USD |

Both approaches keep the user experience simple: load USDC only, no MON required.
