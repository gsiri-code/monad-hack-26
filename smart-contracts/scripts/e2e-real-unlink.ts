/**
 * Real Unlink round-trip: Wallet → Unlink pool (deposit 0.01 USDC) → Wallet (withdraw)
 *
 * Uses the persistent server wallet (UNLINK_MNEMONIC in .env).
 * Deposits go through the real Unlink pool with ZK proofs — not a mock.
 *
 * Prerequisites:
 *   - MONAD_PRIVATE_KEY: EOA with MON for gas
 *   - SENDER_PRIVATE_KEY: Wallet with ≥0.01 USDC (get from https://faucet.circle.com/)
 *   - UNLINK_MNEMONIC: Server wallet mnemonic (run init-server-wallet.ts first)
 *   - RECEIVER_WALLET: Address to receive the withdrawal (defaults to sender)
 *
 * Run with:
 *   npx hardhat run scripts/e2e-real-unlink.ts --network monadTestnet
 */

import { network } from "hardhat";
import { getServerWallet, waitForConfirmation } from "../backend/unlink-wallet.js";

const { ethers } = await network.connect({ network: "monadTestnet" });

const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const USDC_DECIMALS = 6;
const DEPOSIT_AMOUNT = ethers.parseUnits("0.01", USDC_DECIMALS);

const fmt = (v: bigint) => ethers.formatUnits(v, USDC_DECIMALS);

async function main() {
  const signers = await ethers.getSigners();
  const serverSigner = signers[0]; // MONAD_PRIVATE_KEY
  const senderSigner = signers[1] ?? signers[0]; // SENDER_PRIVATE_KEY
  const sender = senderSigner.address;
  const receiver = process.env.RECEIVER_WALLET ?? sender;

  console.log("=== Real Unlink Round-Trip (0.01 USDC) ===\n");
  console.log("Server EOA  :", serverSigner.address);
  console.log("Sender EOA  :", sender);
  console.log("Receiver EOA:", receiver);

  // ── 1. Initialise persistent server wallet ─────────────────────────────────
  console.log("\n--- Step 1: Load server Unlink wallet ---");
  const { unlink, address: unlinkAddress } = await getServerWallet();
  console.log("Unlink address:", unlinkAddress);

  const balancesBefore = await unlink.getBalances();
  const shieldedBefore = balancesBefore[USDC.toLowerCase()] ?? 0n;
  console.log("Shielded USDC :", fmt(shieldedBefore));

  // ── 2. Check sender has USDC ──────────────────────────────────────────────
  const usdc = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
    ],
    USDC,
    senderSigner
  );

  const senderUsdcBefore = await usdc.balanceOf(sender);
  console.log("\nSender USDC   :", fmt(senderUsdcBefore));
  if (senderUsdcBefore < DEPOSIT_AMOUNT) {
    throw new Error(`Sender needs ≥${fmt(DEPOSIT_AMOUNT)} USDC. Get from https://faucet.circle.com/`);
  }

  const senderMon = await ethers.provider.getBalance(sender);
  if (senderMon < ethers.parseEther("0.005")) {
    throw new Error("Sender needs MON for gas. Get from https://faucet.unlink.xyz");
  }

  // ── 3. Deposit into real Unlink pool ───────────────────────────────────────
  console.log("\n--- Step 2: Deposit 0.01 USDC into Unlink ---");

  const depositResult = await unlink.deposit({
    depositor: sender,
    deposits: [{ token: USDC, amount: DEPOSIT_AMOUNT }],
  });

  console.log("Relay ID     :", depositResult.relayId);
  console.log("Pool (to)    :", depositResult.to);

  // Approve the Unlink pool to spend sender's USDC
  const approveTx = await usdc.approve(depositResult.to, DEPOSIT_AMOUNT);
  await approveTx.wait();
  console.log("Approval confirmed");

  // Send the SDK-generated deposit tx
  const depositTx = await senderSigner.sendTransaction({
    to: depositResult.to,
    data: depositResult.calldata,
    value: depositResult.value,
  });
  console.log("Deposit tx   :", depositTx.hash);
  const depositReceipt = await depositTx.wait();
  console.log("Confirmed block:", depositReceipt!.blockNumber);

  // ── 4. Confirm + sync until balance appears ────────────────────────────────
  console.log("\n--- Step 3: Confirm deposit + sync ---");
  try {
    await unlink.confirmDeposit(depositResult.relayId);
    console.log("confirmDeposit OK");
  } catch (e: any) {
    console.log("confirmDeposit:", e.message, "(will retry via sync)");
  }

  let shieldedAfterDeposit = 0n;
  const maxRetries = 20;
  for (let i = 0; i < maxRetries; i++) {
    await unlink.sync({ forceFullResync: true });
    shieldedAfterDeposit = await unlink.getBalance(USDC);
    console.log(`Sync ${i + 1}/${maxRetries} — shielded USDC: ${fmt(shieldedAfterDeposit)}`);
    if (shieldedAfterDeposit >= shieldedBefore + DEPOSIT_AMOUNT) break;
    await new Promise((r) => setTimeout(r, 5_000));
  }

  const expectedMin = shieldedBefore + DEPOSIT_AMOUNT;
  if (shieldedAfterDeposit < expectedMin) {
    throw new Error(`Shielded balance ${shieldedAfterDeposit} < expected ${expectedMin}. Indexer may need more time.`);
  }

  const senderUsdcAfterDeposit = await usdc.balanceOf(sender);
  console.log("\nSender USDC after deposit:", fmt(senderUsdcAfterDeposit));
  console.log("Sender USDC spent       :", fmt(senderUsdcBefore - senderUsdcAfterDeposit));

  // ── 5. Withdraw from Unlink to receiver ────────────────────────────────────
  console.log("\n--- Step 4: Withdraw 0.01 USDC to receiver ---");

  const receiverUsdcBefore = await usdc.balanceOf(receiver);
  console.log("Receiver USDC before:", fmt(receiverUsdcBefore));

  const withdrawResult = await unlink.withdraw({
    withdrawals: [{ token: USDC, amount: DEPOSIT_AMOUNT, recipient: receiver }],
  });
  console.log("Withdraw relay ID:", withdrawResult.relayId);

  console.log("\nWaiting for withdraw confirmation...");
  const withdrawStatus = await waitForConfirmation(unlink, withdrawResult.relayId, {
    timeout: 120_000,
    pollInterval: 3_000,
  });

  console.log("Withdraw tx  :", withdrawStatus.txHash);
  console.log("State        :", withdrawStatus.state);

  // ── 6. Verify ──────────────────────────────────────────────────────────────
  console.log("\n--- Step 5: Verify ---");

  const receiverUsdcAfter = await usdc.balanceOf(receiver);
  await unlink.sync({ forceFullResync: true });
  const shieldedFinal = await unlink.getBalance(USDC);

  console.log("Receiver USDC after :", fmt(receiverUsdcAfter));
  console.log("Receiver net change :", fmt(receiverUsdcAfter - receiverUsdcBefore), "USDC");
  console.log("Shielded USDC final :", fmt(shieldedFinal));

  const success =
    withdrawStatus.state === "succeeded" &&
    receiverUsdcAfter - receiverUsdcBefore === DEPOSIT_AMOUNT;

  console.log("\n=== Result:", success ? "PASS" : "FAIL", "===");
  console.log("\nExplorer:");
  console.log(`  Deposit : https://testnet.monadexplorer.com/tx/${depositTx.hash}`);
  if (withdrawStatus.txHash) {
    console.log(`  Withdraw: https://testnet.monadexplorer.com/tx/${withdrawStatus.txHash}`);
  }
}

main().catch(console.error);
