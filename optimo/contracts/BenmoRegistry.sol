// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BenmoRegistry {
    mapping(bytes32 => string) private handleToUnlinkAddress;
    mapping(address => bytes32) private ownerToHandle;

    event HandleRegistered(bytes32 indexed handleHash, address indexed owner);

    function registerHandle(string calldata handle, string calldata unlinkAddress) external {
        bytes32 handleHash = keccak256(abi.encodePacked(handle));
        require(bytes(handleToUnlinkAddress[handleHash]).length == 0, "Handle already registered");
        require(ownerToHandle[msg.sender] == bytes32(0), "Wallet already registered a handle");

        handleToUnlinkAddress[handleHash] = unlinkAddress;
        ownerToHandle[msg.sender] = handleHash;

        emit HandleRegistered(handleHash, msg.sender);
    }

    function resolveHandle(string calldata handle) external view returns (string memory) {
        bytes32 handleHash = keccak256(abi.encodePacked(handle));
        string memory unlinkAddress = handleToUnlinkAddress[handleHash];
        require(bytes(unlinkAddress).length > 0, "Handle not found");
        return unlinkAddress;
    }
}
