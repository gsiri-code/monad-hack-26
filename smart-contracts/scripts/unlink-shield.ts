import { network } from "hardhat";
import { initUnlink } from "@unlink-xyz/node";

const { ethers } = await network.connect({ network: "monadTestnet" });

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);

  // Initialize Unlink SDK for Monad testnet
  const unlink = await initUnlink({ chain: "monad-testnet" });
  console.log("Unlink initialized");

  // Native MON token address used by Unlink
  const MON_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  // Deposit a small amount of native MON into shielded pool
  const depositAmount = ethers.parseEther("0.01");

  console.log(
    `Depositing ${ethers.formatEther(depositAmount)} MON to shielded pool...`
  );

  const result = await unlink.deposit({
    token: MON_ADDRESS,
    amount: depositAmount.toString(),
  });

  console.log("Deposit relay ID:", result.relayId);
  console.log("Deposit submitted. Shielded balance will update after confirmation.");
}

main().catch(console.error);
