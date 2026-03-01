// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IUnlinkPool {
    function deposit(address token, uint256 amount) external;
    function balanceOf(address token, address account) external view returns (uint256);
}
