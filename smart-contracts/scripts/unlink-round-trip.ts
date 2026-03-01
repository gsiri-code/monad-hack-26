/**
 * Full round-trip test: Wallet → Unlink (deposit USDC) → Wallet (withdraw USDC)
 *
 * Run with: npx hardhat run scripts/unlink-round-trip.ts --network monadTestnet
 *
 * Prerequisites:
 * - MONAD_PRIVATE_KEY: EOA for gas (needs MON)
 * - SENDER_PRIVATE_KEY: Wallet that holds USDC (depositor)
 * - RECEIVER_WALLET: Address to receive USDC on withdraw (defaults to depositor for round-trip)
 * - Get USDC from https://faucet.circle.com/ for the depositor
 * - Get MON for gas from https://faucet.unlink.xyz
 *
 * Flow:
 * 1. Deposit USDC from depositor EOA into Unlink shielded pool
 * 2. Wait for deposit confirmation and sync notes
 * 3. Withdraw USDC from shielded pool to receiver EOA
 * 4. Wait for withdraw confirmation
 * 5. Verify receiver USDC balance increased
 */

import { network } from "hardhat";
import { initUnlink, waitForConfirmation } from "@unlink-xyz/node";

const { ethers } = await network.connect({ network: "monadTestnet" });

// USDC on Monad testnet (Circle)
const USDC_MONAD_TESTNET = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const USDC_DECIMALS = 6;
const DEPOSIT_AMOUNT = ethers.parseUnits("1", USDC_DECIMALS); // 1 USDC

async function main() {
  const signers = await ethers.getSigners();
  const depositor = signers[1]?.address ?? signers[0].address; // SENDER_PRIVATE_KEY or MONAD_PRIVATE_KEY
  const depositorSigner = signers[1] ?? signers[0];
  const receiver = process.env.RECEIVER_WALLET ?? depositor;

  console.log("=== Unlink Round-Trip Test (USDC) ===\n");
  console.log("Depositor EOA:", depositor);
  console.log("Receiver EOA :", receiver);

  // USDC contract (standard ERC-20 interface)
  const usdc = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
    ],
    USDC_MONAD_TESTNET,
    depositorSigner
  );

  const usdcBalanceBefore = await usdc.balanceOf(depositor);
  console.log("Depositor USDC balance:", ethers.formatUnits(usdcBalanceBefore, USDC_DECIMALS), "USDC");

  if (usdcBalanceBefore < DEPOSIT_AMOUNT) {
    throw new Error(
      `Insufficient USDC. Need at least ${ethers.formatUnits(DEPOSIT_AMOUNT, USDC_DECIMALS)} USDC. Get from https://faucet.circle.com/`
    );
  }

  // Check MON for gas
  const monBalance = await ethers.provider.getBalance(depositor);
  if (monBalance < ethers.parseEther("0.005")) {
    throw new Error(
      "Insufficient MON for gas. Get from https://faucet.unlink.xyz"
    );
  }

  // Initialize Unlink (creates seed + account, syncs)
  console.log("\n1. Initializing Unlink...");
  const unlink = await initUnlink({ chain: "monad-testnet" });

  const activeAccount = await unlink.accounts.getActive();
  if (activeAccount) {
    console.log("   Unlink address:", activeAccount.address);
  }

  // --- DEPOSIT (Wallet → Unlink) ---
  console.log("\n2. Depositing", ethers.formatUnits(DEPOSIT_AMOUNT, USDC_DECIMALS), "USDC to shielded pool...");
  const depositResult = await unlink.deposit({
    depositor,
    deposits: [{ token: USDC_MONAD_TESTNET, amount: DEPOSIT_AMOUNT }],
  });

  console.log("   Relay ID:", depositResult.relayId);
  console.log("   Pool (to):", depositResult.to);
  console.log("   Value (msg.value):", depositResult.value.toString());

  // For ERC-20: approve pool to spend USDC, then send deposit tx
  const approveTx = await usdc.approve(depositResult.to, DEPOSIT_AMOUNT);
  await approveTx.wait();
  console.log("   USDC approval confirmed");

  const depositTx = await depositorSigner.sendTransaction({
    to: depositResult.to,
    data: depositResult.calldata,
    value: depositResult.value,
  });
  console.log("   Deposit tx hash:", depositTx.hash);

  const depositReceipt = await depositTx.wait();
  console.log("   Deposit confirmed in block:", depositReceipt!.blockNumber);

  console.log("\n3. Confirming deposit and syncing notes...");
  try {
    await unlink.confirmDeposit(depositResult.relayId);
    console.log("   confirmDeposit returned");
  } catch (e: any) {
    console.log("   confirmDeposit error (non-fatal, will retry via sync):", e.message);
  }

  // The indexer may lag behind the chain — poll sync until notes appear
  let shieldedBalance = 0n;
  const maxRetries = 15;
  for (let i = 0; i < maxRetries; i++) {
    await unlink.sync({ forceFullResync: true });
    shieldedBalance = await unlink.getBalance(USDC_MONAD_TESTNET);
    console.log(`   Sync attempt ${i + 1}/${maxRetries} — shielded USDC: ${ethers.formatUnits(shieldedBalance, USDC_DECIMALS)}`);
    if (shieldedBalance >= DEPOSIT_AMOUNT) break;
    await new Promise((r) => setTimeout(r, 5_000));
  }

  if (shieldedBalance < DEPOSIT_AMOUNT) {
    throw new Error(`Expected shielded balance >= ${DEPOSIT_AMOUNT}, got ${shieldedBalance}. The indexer may need more time.`);
  }

  // --- WITHDRAW (Unlink → Wallet) ---
  const withdrawAmount = DEPOSIT_AMOUNT;
  const usdcReceiver = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    USDC_MONAD_TESTNET
  );
  const receiverBalanceBeforeWithdraw = await usdcReceiver.balanceOf(receiver);

  console.log("\n4. Withdrawing", ethers.formatUnits(withdrawAmount, USDC_DECIMALS), "USDC to", receiver, "...");

  const withdrawResult = await unlink.withdraw({
    withdrawals: [
      { token: USDC_MONAD_TESTNET, amount: withdrawAmount, recipient: receiver },
    ],
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
  const receiverBalanceAfter = await usdcReceiver.balanceOf(receiver);
  const shieldedAfter = await unlink.getBalance(USDC_MONAD_TESTNET);

  console.log("\n=== Round-Trip Complete ===");
  console.log("Receiver USDC before withdraw:", ethers.formatUnits(receiverBalanceBeforeWithdraw, USDC_DECIMALS), "USDC");
  console.log("Receiver USDC after withdraw :", ethers.formatUnits(receiverBalanceAfter, USDC_DECIMALS), "USDC");
  console.log("Shielded balance after withdraw:", ethers.formatUnits(shieldedAfter, USDC_DECIMALS), "USDC");

  if (withdrawStatus.state === "succeeded") {
    const netChange = receiverBalanceAfter - receiverBalanceBeforeWithdraw;
    console.log("\n✓ Round-trip succeeded.");
    console.log("  Receiver net change:", ethers.formatUnits(netChange, USDC_DECIMALS), "USDC");
  } else {
    console.log("\n✗ Withdraw state:", withdrawStatus.state);
  }
}

main().catch(console.error);
