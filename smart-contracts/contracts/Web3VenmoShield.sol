// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUnlinkPool} from "./IUnlinkPool.sol";

contract Web3VenmoShield {
    IUnlinkPool public immutable unlinkPool;

    event SocialPayment(address indexed sender, address indexed receiver, string memo);

    constructor(address _unlinkPool) {
        unlinkPool = IUnlinkPool(_unlinkPool);
    }

    /// @notice Pull tokens from msg.sender, deposit into Unlink pool, emit social event
    /// @param token ERC-20 token address
    /// @param amount Amount to shield
    /// @param receiver Intended recipient (for event only — privacy handled by Unlink)
    /// @param memo Human-readable memo (e.g., "dinner split")
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
