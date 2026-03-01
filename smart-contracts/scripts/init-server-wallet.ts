/**
 * Initialize (or reload) the server-owned Unlink wallet.
 *
 * Run with: npx hardhat run scripts/init-server-wallet.ts --network monadTestnet
 *
 * First run  → creates a new wallet, prints the mnemonic.
 *              Save UNLINK_MNEMONIC in .env to persist it.
 *
 * Later runs → imports the mnemonic from UNLINK_MNEMONIC env var,
 *              recreates the same wallet, and syncs balances.
 *
 * Output includes the unlink1... address and pool address needed for deployment.
 */

import { network } from "hardhat";
import { initUnlink } from "@unlink-xyz/node";

const { ethers } = await network.connect({ network: "monadTestnet" });

const UNLINK_POOL = "0x3027AB04895E170aD5Be3D0453eF61945139c163";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("=== Server Wallet Initialization ===\n");
  console.log("Server EOA (MONAD_PRIVATE_KEY):", signer.address);

  const existingMnemonic = process.env.UNLINK_MNEMONIC;

  let unlink;

  if (existingMnemonic) {
    console.log("\nFound UNLINK_MNEMONIC — importing existing wallet...");
    unlink = await initUnlink({
      chain: "monad-testnet",
      setup: false,
      sync: false,
    });
    await unlink.seed.importMnemonic(existingMnemonic);
    await unlink.accounts.create();
    await unlink.sync();
  } else {
    console.log("\nNo UNLINK_MNEMONIC found — creating NEW wallet...");
    unlink = await initUnlink({ chain: "monad-testnet" });
  }

  const account = await unlink.accounts.getActive();
  if (!account) {
    throw new Error("Failed to create/load Unlink account");
  }

  console.log("\n--- Unlink Server Wallet ---");
  console.log("Unlink address:", account.address);

  const mnemonic = await unlink.seed.exportMnemonic();
  console.log("\n--- MNEMONIC ---");
  console.log(mnemonic);

  if (!existingMnemonic) {
    console.log("\n** ADD THIS TO YOUR .env FILE: **");
    console.log(`UNLINK_MNEMONIC="${mnemonic}"`);
  }

  console.log("\n--- Unlink Pool (for contract deployment) ---");
  console.log("Pool address:", UNLINK_POOL);

  console.log("\n--- Shielded Balances ---");
  const balances = await unlink.getBalances();
  const entries = Object.entries(balances);
  if (entries.length === 0) {
    console.log("(empty — deposit tokens to fund the server wallet)");
  } else {
    for (const [token, amount] of entries) {
      console.log(`  ${token}: ${amount.toString()}`);
    }
  }

  console.log("\n--- Next Steps ---");
  if (!existingMnemonic) {
    console.log("1. Add UNLINK_MNEMONIC to .env (printed above)");
    console.log("2. Deploy Web3VenmoShield:");
  } else {
    console.log("1. Deploy Web3VenmoShield:");
  }
  console.log("   rm -rf ignition/deployments/chain-10143");
  console.log(
    `   npx hardhat ignition deploy ignition/modules/Web3VenmoShield.ts --network monadTestnet --parameters '{"Web3VenmoShieldModule": {"unlinkPool": "${UNLINK_POOL}"}}'`
  );
}

main().catch(console.error);
