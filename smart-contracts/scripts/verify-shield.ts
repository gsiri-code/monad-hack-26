/**
 * Post-deployment verification script.
 * Run with: npx hardhat run scripts/verify-shield.ts --network monadTestnet
 *
 * Set SHIELD_ADDRESS in your .env (or paste it below after deployment).
 */

import { network } from "hardhat";

const { ethers } = await network.connect({ network: "monadTestnet" });

// Paste your deployed contract address here (or set SHIELD_ADDRESS in .env)
const SHIELD_ADDRESS = process.env.SHIELD_ADDRESS ?? "";

async function main() {
  if (!SHIELD_ADDRESS) {
    throw new Error("Set SHIELD_ADDRESS env var to your deployed contract address");
  }

  const [signer] = await ethers.getSigners();
  console.log("Verifying from:", signer.address);

  // Attach to deployed contract
  const shield = await ethers.getContractAt("Web3VenmoShield", SHIELD_ADDRESS);

  // 1. Read on-chain state
  const poolAddress = await shield.unlinkPool();
  console.log("unlinkPool address on-chain:", poolAddress);

  // 2. Query past SocialPayment events from deployment block to latest
  const deployBlock = 0; // narrow this to actual deploy block if you know it
  const events = await shield.queryFilter(
    shield.filters.SocialPayment(),
    deployBlock,
    "latest"
  );

  if (events.length === 0) {
    console.log("No SocialPayment events found yet.");
  } else {
    console.log(`Found ${events.length} SocialPayment event(s):\n`);
    for (const ev of events) {
      console.log({
        block: ev.blockNumber,
        tx: ev.transactionHash,
        sender: ev.args.sender,
        receiver: ev.args.receiver,
        memo: ev.args.memo,
      });
    }
  }
}

main().catch(console.error);
