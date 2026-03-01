/**
 * End-to-end test script for Web3VenmoShield APIs.
 * Run with: bun scripts/test-e2e.ts
 *
 * Requires the dev server to be running: bun dev
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
  process.env[key] ??= val;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:3000";
const RPC_URL = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const SHIELD_CONTRACT = process.env.SHIELD_CONTRACT_ADDRESS ?? "0xf9a83f9322113C6fe84Ed6EFE8affB0b57fB39ac";
const WMON = process.env.SHIELD_TOKEN_ADDRESS ?? "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541";

const SENDER_KEY     = "0xabc0a55744699f6634ffbe0cfeb7e7d9e313b4593a4f0d479a6bf9f242387c0f";
const SENDER_WALLET  = "0xb9fd6f8951AD76BE49bC5d731CB6B35432589A5a";
const RECEIVER_WALLET = "0x86933E922f6D44dbc6233Cd4b5d90457e9B7B754";

const SHIELD_AMOUNT = "0.001"; // WMON to shield

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(step: string, msg: string) {
  console.log(`\n[${step}] ${msg}`);
}

function ok(step: string, msg: string) {
  console.log(`  ✓ [${step}] ${msg}`);
}

async function api(
  urlPath: string,
  opts: { token?: string; method?: string; body?: unknown } = {},
) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${urlPath} → ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Web3VenmoShield E2E Test");
  console.log(`  Contract : ${SHIELD_CONTRACT}`);
  console.log(`  Token    : ${WMON}`);
  console.log(`  Sender   : ${SENDER_WALLET}`);
  console.log(`  Receiver : ${RECEIVER_WALLET}`);
  console.log("═══════════════════════════════════════════════════");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const senderSigner = new ethers.Wallet(SENDER_KEY, provider);

  const wmonAbi = [
    "function deposit() payable",
    "function approve(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
  ];
  const wmon = new ethers.Contract(WMON, wmonAbi, senderSigner);
  const amountWei = ethers.parseEther(SHIELD_AMOUNT);

  // ── Step 1: Wrap MON → WMON if needed ─────────────────────────────────────
  log("1/7", "On-chain setup — wrapping MON and approving contract");

  const monBal = await provider.getBalance(SENDER_WALLET);
  log("1/7", `MON balance: ${ethers.formatEther(monBal)} MON`);

  const wmonBal: bigint = await wmon.balanceOf(SENDER_WALLET);
  log("1/7", `WMON balance: ${ethers.formatEther(wmonBal)} WMON`);

  if (wmonBal < amountWei) {
    if (monBal < amountWei) {
      throw new Error(
        `Sender wallet needs at least ${SHIELD_AMOUNT} MON. Get testnet MON from a faucet.`,
      );
    }
    log("1/7", `Wrapping ${SHIELD_AMOUNT} MON → WMON...`);
    const wrapTx = await senderSigner.sendTransaction({
      to: WMON,
      value: amountWei,
      data: "0xd0e30db0", // deposit()
    });
    await wrapTx.wait();
    ok("1/7", `Wrapped. tx: ${wrapTx.hash}`);
  } else {
    ok("1/7", `WMON balance sufficient (${ethers.formatEther(wmonBal)}), skipping wrap.`);
  }

  const allowance: bigint = await wmon.allowance(SENDER_WALLET, SHIELD_CONTRACT);
  if (allowance < amountWei) {
    log("1/7", "Approving WMON to shield contract...");
    const approveTx = await wmon.approve(SHIELD_CONTRACT, ethers.MaxUint256);
    await approveTx.wait();
    ok("1/7", `Approved. tx: ${approveTx.hash}`);
  } else {
    ok("1/7", "Already approved, skipping.");
  }

  // ── Step 2: Auth tokens ───────────────────────────────────────────────────
  log("2/7", "Getting auth tokens via /api/bridge-test");

  const auth1 = await api("/api/bridge-test", { body: { email: "sender@venmo-test.com" } });
  const token1 = auth1.accessToken;
  const userId1 = auth1.userId;
  ok("2/7", `Sender   uid=${userId1}`);

  const auth2 = await api("/api/bridge-test", { body: { email: "receiver@venmo-test.com" } });
  const token2 = auth2.accessToken;
  const userId2 = auth2.userId;
  ok("2/7", `Receiver uid=${userId2}`);

  // ── Step 3: Create user profiles ─────────────────────────────────────────
  log("3/7", "Creating user profiles (skips if already exist)");

  for (const [label, token, wallet, username, phone] of [
    ["Sender",   token1, SENDER_WALLET,   "alice_shield", "+15550000001"],
    ["Receiver", token2, RECEIVER_WALLET, "bob_shield",   "+15550000002"],
  ] as const) {
    try {
      await api("/api/users", {
        token,
        body: { username, walletAddress: wallet, phoneNumber: phone, firstName: label, lastName: "Test" },
      });
      ok("3/7", `${label} profile created.`);
    } catch (e: any) {
      if (e.message.includes("409")) ok("3/7", `${label} already exists.`);
      else throw e;
    }
  }

  // ── Step 4: Shield tokens via API ─────────────────────────────────────────
  log("4/7", `POST /api/contract/shield  (${SHIELD_AMOUNT} WMON)`);

  const shieldRes = await api("/api/contract/shield", {
    token: token1,
    body: {
      amount: SHIELD_AMOUNT,
      receiverWallet: RECEIVER_WALLET,
      token: WMON,
      memo: "e2e test shield",
    },
  });
  ok("4/7", `Shield tx: ${shieldRes.txHash}`);

  // ── Step 5: Check shielded balance ────────────────────────────────────────
  log("5/7", `GET /api/users/${userId1}/wallet`);

  const walletRes = await api(`/api/users/${userId1}/wallet`, { token: token1 });
  for (const entry of walletRes.wallet) {
    ok("5/7", `${entry.currencyName}: ${entry.amount}`);
  }

  const shieldedEntry = walletRes.wallet.find((w: any) =>
    w.currencyName === "MON (Shielded)",
  );
  if (!shieldedEntry || Number(shieldedEntry.amount) === 0) {
    throw new Error("Shielded balance is 0 — shield step may have failed.");
  }

  // ── Step 6: Create request + execute trade ────────────────────────────────
  log("6/7", `Creating request  sender=${userId1} → receiver=${userId2}  amount=${SHIELD_AMOUNT}`);

  const request = await api("/api/requests", {
    token: token1,
    body: {
      sender: userId1,
      receiver: userId2,
      amount: SHIELD_AMOUNT,
      message: "e2e test payment",
    },
  });
  ok("6/7", `Request created: ${request.uid}  status=${request.status}`);

  log("6/7", `POST /api/trades/execute  requestId=${request.uid}`);
  const tradeRes = await api("/api/trades/execute", {
    token: token1,
    body: { requestId: request.uid },
  });
  ok("6/7", `Trade executed: txHash=${tradeRes.txHash}  status=${tradeRes.status}`);

  // ── Step 7: Final balance check ───────────────────────────────────────────
  log("7/7", "Final wallet balances");

  const final1 = await api(`/api/users/${userId1}/wallet`, { token: token1 });
  console.log("  Sender wallet:");
  for (const e of final1.wallet) console.log(`    ${e.currencyName}: ${e.amount}`);

  const final2 = await api(`/api/users/${userId2}/wallet`, { token: token2 });
  console.log("  Receiver wallet:");
  for (const e of final2.wallet) console.log(`    ${e.currencyName}: ${e.amount}`);

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ALL STEPS PASSED");
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n[FAIL]", err.message ?? err);
  process.exit(1);
});
