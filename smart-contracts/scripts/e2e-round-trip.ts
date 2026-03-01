/**
 * End-to-end round-trip on Monad testnet using REAL USDC:
 *   1. Deploy MockUnlinkPool + Web3VenmoShield (uses real USDC, mock pool)
 *   2. Deposit: sender calls shieldAndPay with 0.01 USDC
 *   3. Verify: internal balance, pool balance, events
 *   4. Withdraw: owner calls unshieldAndPay → receiver gets 0.01 USDC
 *   5. Verify: receiver USDC increased, internal balance zeroed
 *
 * Prerequisites:
 *   - Sender (SENDER_PRIVATE_KEY) needs ≥0.01 USDC from https://faucet.circle.com/
 *   - Both signers need MON for gas from https://faucet.unlink.xyz
 *
 * Run with:
 *   npx hardhat run scripts/e2e-round-trip.ts --network monadTestnet
 */

import { network } from "hardhat";

const { ethers } = await network.connect({ network: "monadTestnet" });

const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const USDC_DECIMALS = 6;

const fmt = (v: bigint) => ethers.formatUnits(v, USDC_DECIMALS);

async function main() {
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const sender = signers[1] ?? signers[0];
  const receiverAddress = process.env.RECEIVER_WALLET ?? owner.address;

  console.log("=== E2E Round-Trip (USDC) ===\n");
  console.log("Owner (server) :", owner.address);
  console.log("Sender (user)  :", sender.address);
  console.log("Receiver       :", receiverAddress);
  console.log("USDC address   :", USDC);

  const ownerMon = await ethers.provider.getBalance(owner.address);
  const senderMon = await ethers.provider.getBalance(sender.address);
  console.log("Owner MON      :", ethers.formatEther(ownerMon));
  console.log("Sender MON     :", ethers.formatEther(senderMon));

  if (ownerMon < ethers.parseEther("0.01")) {
    throw new Error("Owner needs MON for gas. Get from https://faucet.unlink.xyz");
  }

  const usdc = await ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
    ],
    USDC,
    sender
  );

  const depositAmount = ethers.parseUnits("0.01", USDC_DECIMALS); // 10000 raw units

  const senderUsdc = await usdc.balanceOf(sender.address);
  console.log("Sender USDC    :", fmt(senderUsdc));

  if (senderUsdc < depositAmount) {
    throw new Error(
      `Sender needs ≥${fmt(depositAmount)} USDC. Current: ${fmt(senderUsdc)}. Get from https://faucet.circle.com/`
    );
  }

  // Fund sender with MON for gas if needed
  if (sender.address !== owner.address && senderMon < ethers.parseEther("0.005")) {
    const gasTx = await owner.sendTransaction({
      to: sender.address,
      value: ethers.parseEther("0.01"),
    });
    await gasTx.wait();
    console.log("Funded sender with 0.01 MON for gas");
  }

  // ── 1. Deploy pool + shield ────────────────────────────────────────────────
  console.log("\n--- Step 1: Deploy contracts ---");

  const pool = await ethers.deployContract("MockUnlinkPool");
  await pool.waitForDeployment();
  console.log("MockUnlinkPool  :", await pool.getAddress());

  const shield = await ethers.deployContract("Web3VenmoShield", [await pool.getAddress()]);
  await shield.waitForDeployment();
  console.log("Web3VenmoShield :", await shield.getAddress());
  console.log("Shield owner    :", await shield.owner());

  // ── 2. Deposit 0.01 USDC (shieldAndPay) ────────────────────────────────────
  console.log("\n--- Step 2: Deposit 0.01 USDC (wallet → pool) ---");

  const senderBefore = await usdc.balanceOf(sender.address);
  console.log("Sender USDC before :", fmt(senderBefore));

  const approveTx = await usdc.connect(sender).approve(await shield.getAddress(), depositAmount);
  await approveTx.wait();
  console.log("Approval confirmed");

  const depositTx = await shield
    .connect(sender)
    .shieldAndPay(USDC, depositAmount, receiverAddress, "0.01 USDC deposit");
  const depositReceipt = await depositTx.wait();
  console.log("shieldAndPay tx :", depositTx.hash);
  console.log("Block           :", depositReceipt!.blockNumber);

  // ── 3. Verify deposit ──────────────────────────────────────────────────────
  console.log("\n--- Step 3: Verify deposit ---");

  const senderAfter = await usdc.balanceOf(sender.address);
  const userBalance = await shield.balanceOf(USDC, sender.address);
  const totalShielded = await shield.totalShielded(USDC);
  const poolBal = await usdc.balanceOf(await pool.getAddress());

  console.log("Sender USDC after  :", fmt(senderAfter));
  console.log("User internal bal  :", fmt(userBalance));
  console.log("Total shielded     :", fmt(totalShielded));
  console.log("Pool USDC balance  :", fmt(poolBal));

  const depositOk =
    senderBefore - senderAfter === depositAmount &&
    userBalance === depositAmount &&
    totalShielded === depositAmount;
  console.log("Deposit correct    :", depositOk ? "YES" : "FAIL");

  const shieldAddr = (await shield.getAddress()).toLowerCase();
  for (const log of depositReceipt!.logs.filter((l: any) => l.address.toLowerCase() === shieldAddr)) {
    const parsed = shield.interface.parseLog({ topics: log.topics as string[], data: log.data });
    if (parsed) console.log(`Event: ${parsed.name}(${parsed.args.join(", ")})`);
  }

  // ── 4. Withdraw 0.01 USDC (unshieldAndPay) ─────────────────────────────────
  console.log("\n--- Step 4: Withdraw 0.01 USDC (pool → receiver) ---");

  const receiverBefore = await usdc.balanceOf(receiverAddress);
  console.log("Receiver USDC before:", fmt(receiverBefore));

  const withdrawTx = await shield
    .connect(owner)
    .unshieldAndPay(sender.address, USDC, depositAmount, receiverAddress, "0.01 USDC withdraw");
  const withdrawReceipt = await withdrawTx.wait();
  console.log("unshieldAndPay tx   :", withdrawTx.hash);
  console.log("Block               :", withdrawReceipt!.blockNumber);

  // ── 5. Verify withdraw ─────────────────────────────────────────────────────
  console.log("\n--- Step 5: Verify withdraw ---");

  const receiverAfter = await usdc.balanceOf(receiverAddress);
  const userBalAfter = await shield.balanceOf(USDC, sender.address);
  const totalAfter = await shield.totalShielded(USDC);

  console.log("Receiver USDC after :", fmt(receiverAfter));
  console.log("Receiver net change :", fmt(receiverAfter - receiverBefore), "USDC");
  console.log("User internal bal   :", fmt(userBalAfter));
  console.log("Total shielded      :", fmt(totalAfter));

  const withdrawOk =
    receiverAfter - receiverBefore === depositAmount &&
    userBalAfter === 0n &&
    totalAfter === 0n;
  console.log("Withdraw correct    :", withdrawOk ? "YES" : "FAIL");

  for (const log of withdrawReceipt!.logs.filter((l: any) => l.address.toLowerCase() === shieldAddr)) {
    const parsed = shield.interface.parseLog({ topics: log.topics as string[], data: log.data });
    if (parsed) console.log(`Event: ${parsed.name}(${parsed.args.join(", ")})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  console.log("Deposit:", depositOk ? "PASS" : "FAIL");
  console.log("Withdraw:", withdrawOk ? "PASS" : "FAIL");
  console.log("Round-trip:", depositOk && withdrawOk ? "PASS" : "FAIL");

  console.log("\nExplorer links:");
  console.log(`  Deposit : https://testnet.monadexplorer.com/tx/${depositTx.hash}`);
  console.log(`  Withdraw: https://testnet.monadexplorer.com/tx/${withdrawTx.hash}`);
  console.log(`  Contract: https://testnet.monadexplorer.com/address/${await shield.getAddress()}`);
}

main().catch(console.error);
