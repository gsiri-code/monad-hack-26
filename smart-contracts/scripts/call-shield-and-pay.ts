/**
 * End-to-end testnet script:
 *   1. Deploy MockERC20 + MockUnlinkPool on Monad testnet
 *   2. Deploy (or reuse) Web3VenmoShield wired to the mock pool
 *   3. Mint tokens, approve, call shieldAndPay
 *   4. Print the SocialPayment event from the receipt
 *
 * Run with:
 *   npx hardhat run scripts/call-shield-and-pay.ts --network monadTestnet
 *
 * Optional env overrides (skip redeployment if already done):
 *   TOKEN_ADDRESS=0x...
 *   POOL_ADDRESS=0x...
 *   SHIELD_ADDRESS=0x...
 */

import { network } from "hardhat";

const { ethers } = await network.connect({ network: "monadTestnet" });

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(signer.address)),
    "MON\n"
  );

  // ── 1. Token ──────────────────────────────────────────────────────────────
  let token;
  if (process.env.TOKEN_ADDRESS) {
    token = await ethers.getContractAt("MockERC20", process.env.TOKEN_ADDRESS);
    console.log("Reusing MockERC20 at", await token.getAddress());
  } else {
    const supply = ethers.parseEther("1000000");
    token = await ethers.deployContract("MockERC20", ["TestUSD", "TUSD", supply]);
    await token.waitForDeployment();
    console.log("MockERC20 deployed at", await token.getAddress());
  }

  // ── 2. Pool ───────────────────────────────────────────────────────────────
  let pool;
  if (process.env.POOL_ADDRESS) {
    pool = await ethers.getContractAt("MockUnlinkPool", process.env.POOL_ADDRESS);
    console.log("Reusing MockUnlinkPool at", await pool.getAddress());
  } else {
    pool = await ethers.deployContract("MockUnlinkPool");
    await pool.waitForDeployment();
    console.log("MockUnlinkPool deployed at", await pool.getAddress());
  }

  // ── 3. Shield contract ────────────────────────────────────────────────────
  let shield;
  if (process.env.SHIELD_ADDRESS) {
    shield = await ethers.getContractAt("Web3VenmoShield", process.env.SHIELD_ADDRESS);
    console.log("Reusing Web3VenmoShield at", await shield.getAddress());
  } else {
    shield = await ethers.deployContract("Web3VenmoShield", [await pool.getAddress()]);
    await shield.waitForDeployment();
    console.log("Web3VenmoShield deployed at", await shield.getAddress());
  }

  // ── 4. Approve + call shieldAndPay ────────────────────────────────────────
  const amount = ethers.parseEther("10");
  const receiver = "0x000000000000000000000000000000000000dEaD"; // dummy recipient
  const memo = "hackathon demo";

  console.log("\nApproving", ethers.formatEther(amount), "TUSD...");
  const approveTx = await token.approve(await shield.getAddress(), amount);
  await approveTx.wait();
  console.log("Approved. tx:", approveTx.hash);

  console.log("Calling shieldAndPay...");
  const tx = await shield.shieldAndPay(
    await token.getAddress(),
    amount,
    receiver,
    memo
  );
  const receipt = await tx.wait();
  console.log("Transaction confirmed. tx:", tx.hash);
  console.log("Block:", receipt!.blockNumber);

  // ── 5. Parse SocialPayment event ──────────────────────────────────────────
  const shieldAddress = (await shield.getAddress()).toLowerCase();
  const socialLogs = receipt!.logs.filter(
    (l: any) => l.address.toLowerCase() === shieldAddress
  );

  if (socialLogs.length === 0) {
    console.error("\nNo SocialPayment event found in logs!");
    return;
  }

  const decoded = shield.interface.parseLog({
    topics: socialLogs[0].topics as string[],
    data: socialLogs[0].data,
  });

  console.log("\n✓ SocialPayment event:");
  console.log("  sender  :", decoded!.args.sender);
  console.log("  receiver:", decoded!.args.receiver);
  console.log("  memo    :", decoded!.args.memo);
  console.log("\n(No amount field — privacy preserved.)");

  // ── 6. Confirm balances changed ───────────────────────────────────────────
  const signerBal = await token.balanceOf(signer.address);
  const poolBal = await token.balanceOf(await pool.getAddress());
  console.log("\nSigner TUSD balance:", ethers.formatEther(signerBal));
  console.log("Pool TUSD balance  :", ethers.formatEther(poolBal), "(shielded)");

  console.log("\nExplorer link:");
  console.log(`  https://testnet.monadexplorer.com/tx/${tx.hash}`);
}

main().catch(console.error);
