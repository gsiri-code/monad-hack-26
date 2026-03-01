/**
 * Full round-trip test: Wallet → Unlink (deposit) → Wallet (withdraw)
 *
 * Run with: npx hardhat run scripts/unlink-round-trip.ts --network monadTestnet
 *
 * Prerequisites:
 * - MONAD_PRIVATE_KEY: EOA that holds MON for gas and deposit
 * - Wallet must have ~0.02 MON (0.01 to deposit + gas for deposit + gas for any prior txs)
 *
 * Flow:
 * 1. Deposit native MON from EOA into Unlink shielded pool
 * 2. Wait for deposit confirmation and sync notes
 * 3. Withdraw from shielded pool back to same EOA
 * 4. Wait for withdraw confirmation
 * 5. Verify EOA balance increased
 */

import { network } from "hardhat";
import { initUnlink, waitForConfirmation } from "@unlink-xyz/node";

const { ethers } = await network.connect({ network: "monadTestnet" });

const MON_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DEPOSIT_AMOUNT = ethers.parseEther("0.01");

async function main() {
  const [signer] = await ethers.getSigners();
  const depositor = signer.address;

  console.log("=== Unlink Round-Trip Test ===\n");
  console.log("Depositor EOA:", depositor);

  // Check initial balance
  const balanceBefore = await ethers.provider.getBalance(depositor);
  console.log("EOA balance before:", ethers.formatEther(balanceBefore), "MON");

  if (balanceBefore < DEPOSIT_AMOUNT + ethers.parseEther("0.005")) {
    throw new Error(
      `Insufficient balance. Need at least ${ethers.formatEther(DEPOSIT_AMOUNT + ethers.parseEther("0.005"))} MON (deposit + gas). Get from https://faucet.unlink.xyz`
    );
  }

  // Initialize Unlink (creates seed + account, syncs)
  console.log("\n1. Initializing Unlink...");
  const unlink = await initUnlink({ chain: "monad-testnet" });

  const accounts = await unlink.accounts.list();
  const activeAccount = await unlink.accounts.getActive();
  if (activeAccount) {
    console.log("   Unlink address:", activeAccount.address);
  }

  // --- DEPOSIT (Wallet → Unlink) ---
  console.log("\n2. Depositing", ethers.formatEther(DEPOSIT_AMOUNT), "MON to shielded pool...");
  const depositResult = await unlink.deposit({
    depositor,
    deposits: [{ token: MON_ADDRESS, amount: DEPOSIT_AMOUNT }],
  });

  console.log("   Relay ID:", depositResult.relayId);
  console.log("   Pool (to):", depositResult.to);
  console.log("   Value (msg.value):", depositResult.value.toString());

  const depositTx = await signer.sendTransaction({
    to: depositResult.to,
    data: depositResult.calldata,
    value: depositResult.value,
  });
  console.log("   Deposit tx hash:", depositTx.hash);

  const depositReceipt = await depositTx.wait();
  console.log("   Deposit confirmed in block:", depositReceipt!.blockNumber);

  console.log("\n3. Confirming deposit and syncing notes...");
  await unlink.confirmDeposit(depositResult.relayId);

  const shieldedBalance = await unlink.getBalance(MON_ADDRESS);
  console.log("   Shielded MON balance:", ethers.formatEther(shieldedBalance));

  if (shieldedBalance < DEPOSIT_AMOUNT) {
    throw new Error(`Expected shielded balance >= ${DEPOSIT_AMOUNT}, got ${shieldedBalance}`);
  }

  // --- WITHDRAW (Unlink → Wallet) ---
  const withdrawAmount = DEPOSIT_AMOUNT; // Withdraw full amount
  console.log("\n4. Withdrawing", ethers.formatEther(withdrawAmount), "MON to EOA...");

  const withdrawResult = await unlink.withdraw({
    withdrawals: [{ token: MON_ADDRESS, amount: withdrawAmount, recipient: depositor }],
  });

  console.log("   Withdraw relay ID:", withdrawResult.relayId);

  console.log("\n5. Waiting for withdraw confirmation...");
  const withdrawStatus = await waitForConfirmation(unlink, withdrawResult.relayId, {
    timeout: 120_000,
    pollInterval: 3_000,
  });

  console.log("   Withdraw tx hash:", withdrawStatus.txHash);
  console.log("   State:", withdrawStatus.state);

  // --- VERIFY ---
  const balanceAfter = await ethers.provider.getBalance(depositor);
  const shieldedAfter = await unlink.getBalance(MON_ADDRESS);

  console.log("\n=== Round-Trip Complete ===");
  console.log("EOA balance before:", ethers.formatEther(balanceBefore), "MON");
  console.log("EOA balance after :", ethers.formatEther(balanceAfter), "MON");
  console.log("Shielded balance after withdraw:", ethers.formatEther(shieldedAfter), "MON");

  if (withdrawStatus.state === "succeeded") {
    const netChange = balanceAfter - balanceBefore;
    console.log("\n✓ Round-trip succeeded.");
    console.log("  EOA net change:", ethers.formatEther(netChange), "MON (withdraw - gas)");
  } else {
    console.log("\n✗ Withdraw state:", withdrawStatus.state);
  }
}

main().catch(console.error);
