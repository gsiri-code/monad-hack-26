# How the Smart Contracts Work

A plain-English guide to the contracts powering the Web3 Venmo shield layer.

---

## The Big Picture

When Alice wants to privately pay Bob, she doesn't send tokens directly. Instead:

1. Alice hands her tokens to our contract (`Web3VenmoShield`)
2. The contract passes them into the Unlink privacy pool
3. A `SocialPayment` event fires publicly — but **only reveals who sent, who receives, and a memo** — not the amount
4. Inside the Unlink pool, the tokens live as a private "note" tied to Bob's Unlink address — invisible on-chain

```
Alice's wallet
    │
    │  transferFrom (ERC-20 approval required first)
    ▼
Web3VenmoShield contract
    │
    │  deposit(token, amount)
    ▼
Unlink Pool contract
    │  (tokens sit here as a shielded note)
    │
    ▼
  Bob claims privately using ZK proof (via Unlink SDK)
```

---

## Contract 1: `IUnlinkPool.sol` — The Interface

```solidity
interface IUnlinkPool {
    function deposit(address token, uint256 amount) external;
    function balanceOf(address token, address account) external view returns (uint256);
}
```

**What it is:** A Solidity *interface* — a description of what a pool contract must be able to do, without saying *how* it does it.

**Why it exists:** Our main contract (`Web3VenmoShield`) talks to the pool through this interface. In tests, we plug in a fake pool (`MockUnlinkPool`). In production, we'd plug in the real Unlink pool. The main contract doesn't care which one it is — as long as it has these two functions.

This is the same idea as a USB port: the device doesn't care what's plugged in, as long as it fits the socket.

**The two functions:**

| Function | What it does |
|----------|-------------|
| `deposit(token, amount)` | Accepts tokens into the pool and creates a private note |
| `balanceOf(token, account)` | Returns how much of a token an account has shielded |

---

## Contract 2: `Web3VenmoShield.sol` — The Core Contract

```solidity
contract Web3VenmoShield {
    IUnlinkPool public immutable unlinkPool;

    event SocialPayment(address indexed sender, address indexed receiver, string memo);

    constructor(address _unlinkPool) {
        unlinkPool = IUnlinkPool(_unlinkPool);
    }

    function shieldAndPay(
        address token,
        uint256 amount,
        address receiver,
        string calldata memo
    ) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(unlinkPool), amount);
        unlinkPool.deposit(token, amount);
        emit SocialPayment(msg.sender, receiver, memo);
    }
}
```

### The storage variable

```solidity
IUnlinkPool public immutable unlinkPool;
```

- `immutable` means this is set once at deployment and can never change. It's hardcoded into the contract's bytecode. Cheaper to read than a regular variable.
- It stores the address of the Unlink pool this contract will forward tokens to.

### The event

```solidity
event SocialPayment(address indexed sender, address indexed receiver, string memo);
```

Events are permanent log entries written to the blockchain. Anyone can read them, but they can't be changed or deleted.

**Key design decision — no `amount` field.** The amount is deliberately omitted. Anyone watching the chain can see *that* a payment happened and *between whom*, but not *how much*. The actual value stays private inside Unlink's ZK pool.

The `indexed` keyword on `sender` and `receiver` means these can be efficiently searched — you can ask "show me all payments sent by Alice" without scanning every transaction.

### The constructor

```solidity
constructor(address _unlinkPool) {
    unlinkPool = IUnlinkPool(_unlinkPool);
}
```

Runs once when the contract is deployed. Takes the Unlink pool address as an argument and stores it. The `IUnlinkPool(...)` cast tells Solidity "treat this address as a contract that implements the IUnlinkPool interface."

### The `shieldAndPay` function — step by step

```solidity
function shieldAndPay(address token, uint256 amount, address receiver, string calldata memo) external {
```

- `external` means only wallets and other contracts can call this — the contract cannot call itself
- `calldata` for the string means it's read-only and stored in call data (cheaper gas than `memory`)

**Step 1: Pull tokens from the caller**
```solidity
IERC20(token).transferFrom(msg.sender, address(this), amount);
```
- `msg.sender` is whoever called this function (Alice's wallet)
- `address(this)` is this contract's own address
- Before calling `shieldAndPay`, Alice must call `approve()` on the token contract to grant permission. Without the approval, this line reverts and the whole transaction fails — no tokens move.

**Step 2: Approve the pool to take the tokens**
```solidity
IERC20(token).approve(address(unlinkPool), amount);
```
The tokens are now in this contract. We need to tell the token contract "allow the Unlink pool to take these tokens from me."

**Step 3: Deposit into the Unlink pool**
```solidity
unlinkPool.deposit(token, amount);
```
Calls the pool's `deposit` function. The pool pulls the tokens from this contract (using the approval from step 2) and creates a private note. Tokens leave this contract entirely.

**Step 4: Emit the social event**
```solidity
emit SocialPayment(msg.sender, receiver, memo);
```
Writes the public log entry. Notice: no `amount` here. The event says "Alice paid Bob with memo 'dinner'" — not how much.

---

## Contract 3: `MockUnlinkPool.sol` — The Test Double

```solidity
contract MockUnlinkPool is IUnlinkPool {
    mapping(address => mapping(address => uint256)) public shieldedBalances;

    function deposit(address token, uint256 amount) external override {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        shieldedBalances[token][msg.sender] += amount;
    }

    function balanceOf(address token, address account) external view returns (uint256) {
        return shieldedBalances[token][account];
    }
}
```

**What it is:** A fake version of the Unlink pool used only in local tests. It behaves the same way as the real pool from the outside, but instead of ZK proofs and privacy, it just keeps a simple balance ledger.

**The mapping:**
```solidity
mapping(address => mapping(address => uint256)) public shieldedBalances;
```
A nested mapping: `token address → depositor address → balance`. Think of it as a spreadsheet:

| Token | Depositor | Balance |
|-------|-----------|---------|
| TUSD | Shield contract | 100 |
| TUSD | Alice | 0 |

**Why `msg.sender` is the Shield contract:** When `Web3VenmoShield` calls `pool.deposit(token, amount)`, the pool sees `msg.sender` as the Shield contract's address — not Alice's. That's because the Shield contract is making the call. So the shielded balance is credited to the Shield contract's address in the mock.

---

## Contract 4: `MockERC20.sol` — The Test Token

```solidity
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
```

A minimal ERC-20 token for testing. It inherits everything from OpenZeppelin's battle-tested `ERC20` implementation. On deploy, it mints `initialSupply` tokens to whoever deployed it. In production you'd use a real token like USDC.

---

## The ERC-20 Approval Pattern

A crucial concept used throughout: before any contract can move your tokens, you must *approve* it first. This is a security feature of ERC-20.

```
Without approval:                    With approval:
Alice → contract.transferFrom()      Alice → token.approve(contract, amount)
         ↓                                    ↓
         REVERT: not allowed          contract.transferFrom(Alice, dest, amount)
                                               ↓
                                               SUCCESS
```

In `shieldAndPay`, Alice must call `approve` on the token contract before calling `shieldAndPay`. The scripts handle this automatically.

---

## What Stays Private vs. What's Public

| Data | Visibility | Where |
|------|-----------|-------|
| Sender address | **Public** | `SocialPayment` event (indexed) |
| Receiver address | **Public** | `SocialPayment` event (indexed) |
| Memo | **Public** | `SocialPayment` event |
| Amount | **Private** | Hidden inside Unlink pool |
| Token type | **Private** | Hidden inside Unlink pool |
| Unlink recipient's internal address | **Private** | Never on-chain |

---

## How Testnet vs. Production Differs

| | Testnet (now) | Production |
|--|---------------|-----------|
| Token | MockERC20 (worthless) | Real USDC or other ERC-20 |
| Pool | MockUnlinkPool (simple ledger) | Real Unlink pool (ZK proofs) |
| Privacy | None — balances visible in mock | Real — amounts hidden by ZK |
| Pool address | Deployed by us for testing | Unlink's deployed contract address |

The `Web3VenmoShield` contract itself does not change between testnet and production — only the pool address passed to its constructor changes.
