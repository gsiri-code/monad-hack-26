"use client";

import { useUnlink } from "@unlink-xyz/react";
import { useState } from "react";
import { USDC_MONAD } from "@/lib/constants";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ onClose, onSuccess }: Props) {
  const { activeAccount, send } = useUnlink();
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePay() {
    if (!receiver.trim() || !amount || !memo.trim()) {
      setErrorMsg("All fields are required");
      return;
    }
    if (!activeAccount) {
      setErrorMsg("No wallet connected");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      // Private transfer via Unlink — amount never hits public chain state
      // recipient must be a bech32m Unlink address (unlink1...)
      // USDC has 6 decimals: 5.0 USDC → 5_000_000n
      const rawAmount = BigInt(Math.round(parseFloat(amount) * 1_000_000));
      const result = await send([
        { token: USDC_MONAD, recipient: receiver.trim(), amount: rawAmount },
      ]);

      // Save social metadata (no amount) to DB
      await fetch("/api/social-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: activeAccount.address,
          receiver: receiver.trim(),
          memo: memo.trim(),
          relay_id: result.relayId,
          visibility,
        }),
      });

      setStatus("done");
      onSuccess?.();
      setTimeout(onClose, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transfer failed");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Pay</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Recipient Unlink address (unlink1...)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Amount (USDC)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Memo (e.g. dinner split)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            {(["public", "friends", "private"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  visibility === v
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <p className="text-xs text-gray-400">
            The amount is private. Only the memo and parties are shared with{" "}
            {visibility === "public" ? "everyone" : visibility === "friends" ? "your friends" : "nobody"}.
          </p>

          <button
            onClick={handlePay}
            disabled={status === "sending" || status === "done"}
            className="bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "sending"
              ? "Sending..."
              : status === "done"
              ? "Sent!"
              : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
