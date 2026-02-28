// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUnlinkPool} from "../IUnlinkPool.sol";

contract MockUnlinkPool is IUnlinkPool {
    // token => account => shielded balance
    mapping(address => mapping(address => uint256)) public shieldedBalances;

    function deposit(address token, uint256 amount) external override {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        shieldedBalances[token][msg.sender] += amount;
    }

    function balanceOf(address token, address account) external view override returns (uint256) {
        return shieldedBalances[token][account];
    }
}
