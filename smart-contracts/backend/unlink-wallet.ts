/**
 * Server-owned Unlink wallet — singleton that persists via UNLINK_MNEMONIC.
 *
 * Usage:
 *   import { getServerWallet } from "../backend/unlink-wallet.js";
 *   const wallet = await getServerWallet();
 *   // wallet.unlink  — the Unlink SDK instance (deposit, withdraw, sync, etc.)
 *   // wallet.address  — the unlink1... address
 */

import { initUnlink, waitForConfirmation } from "@unlink-xyz/node";
import type { Unlink } from "@unlink-xyz/core";

export { waitForConfirmation };

export interface ServerWallet {
  unlink: Unlink;
  address: string;
}

let cached: ServerWallet | null = null;

/**
 * Initialise (or return cached) server Unlink wallet.
 * Reads UNLINK_MNEMONIC from process.env for persistence.
 * If no mnemonic exists, creates a fresh wallet and logs the mnemonic to save.
 */
export async function getServerWallet(): Promise<ServerWallet> {
  if (cached) return cached;

  const mnemonic = process.env.UNLINK_MNEMONIC;

  let unlink: Unlink;

  if (mnemonic) {
    unlink = await initUnlink({
      chain: "monad-testnet",
      setup: false,
      sync: false,
    });
    await unlink.seed.importMnemonic(mnemonic);
    await unlink.accounts.create();
    await unlink.sync();
  } else {
    console.warn("[unlink-wallet] No UNLINK_MNEMONIC found — creating NEW wallet.");
    console.warn("[unlink-wallet] Save the mnemonic below to .env to persist it.\n");
    unlink = await initUnlink({ chain: "monad-testnet" });
    const newMnemonic = await unlink.seed.exportMnemonic();
    console.warn(`UNLINK_MNEMONIC="${newMnemonic}"\n`);
  }

  const account = await unlink.accounts.getActive();
  if (!account) throw new Error("Failed to initialise Unlink account");

  cached = { unlink, address: account.address };
  return cached;
}
