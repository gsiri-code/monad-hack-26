// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUnlinkPool} from "./IUnlinkPool.sol";

/// @title Web3VenmoShield
/// @notice Central custodian contract for private Venmo-style payments.
///         The server (owner) controls a single Unlink account off-chain via the SDK.
///         All user deposits flow into this shared shielded pool; the contract tracks
///         per-user balances internally so the server knows who owns what.
///         Only the owner can trigger withdrawals from the pool to recipients.
contract Web3VenmoShield {
    IUnlinkPool public immutable unlinkPool;
    address public owner;

    /// @dev token => user => amount deposited into the shielded pool
    mapping(address => mapping(address => uint256)) public userBalances;

    event SocialPayment(
        address indexed sender,
        address indexed receiver,
        string memo
    );
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, address indexed recipient, uint256 amount);
    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _unlinkPool) {
        unlinkPool = IUnlinkPool(_unlinkPool);
        owner = msg.sender;
    }

    /// @notice Wallet → Unlink: user deposits tokens into the server's shielded pool
    function shieldAndPay(
        address token,
        uint256 amount,
        address receiver,
        string calldata memo
    ) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(unlinkPool), amount);
        unlinkPool.deposit(token, amount);

        userBalances[token][msg.sender] += amount;

        emit Deposited(msg.sender, token, amount);
        emit SocialPayment(msg.sender, receiver, memo);
    }

    /// @notice Unlink → Wallet: server withdraws from the pool on behalf of a user
    /// @param user The user whose internal balance to debit
    /// @param token ERC-20 token address
    /// @param amount Amount to unshield
    /// @param receiver Address that receives the tokens on-chain
    /// @param memo Human-readable memo (e.g., "cash out")
    function unshieldAndPay(
        address user,
        address token,
        uint256 amount,
        address receiver,
        string calldata memo
    ) external onlyOwner {
        require(userBalances[token][user] >= amount, "Insufficient user balance");
        userBalances[token][user] -= amount;

        unlinkPool.withdraw(token, amount, receiver);

        emit Withdrawn(user, token, receiver, amount);
        emit SocialPayment(user, receiver, memo);
    }

    /// @notice Total tokens this contract has shielded in the Unlink pool
    function totalShielded(address token) external view returns (uint256) {
        return unlinkPool.balanceOf(token, address(this));
    }

    /// @notice A specific user's balance within the shielded pool
    function balanceOf(address token, address user) external view returns (uint256) {
        return userBalances[token][user];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
}
