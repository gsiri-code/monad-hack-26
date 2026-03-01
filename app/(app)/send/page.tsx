"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as friendshipsService from "@/lib/api/services/friendships";
import * as transactionsService from "@/lib/api/services/transactions";
import type {
  FriendshipListItem,
  PublicTransactionExecuteResponse,
  PrivateTransactionExecuteResponse,
} from "@/types/api";

type TxMode = "public" | "private";
type Step = "form" | "confirm" | "result";

export default function SendPage() {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [mode, setMode] = useState<TxMode>("public");
  const [receiverUid, setReceiverUid] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<
    PublicTransactionExecuteResponse | PrivateTransactionExecuteResponse | null
  >(null);

  // Private tx fields
  const [ciphertext, setCiphertext] = useState("");
  const [nonce, setNonce] = useState("");
  const [senderPubkey, setSenderPubkey] = useState("");

  const loadFriends = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await friendshipsService.listFriendships(profile.uid);
      setFriends(res.friendships);
    } catch {
      setFriends([]);
    }
  }, [profile]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function handleSend() {
    if (!profile) return;
    setError("");
    setLoading(true);
    try {
      if (mode === "public") {
        const res = await transactionsService.executePublicTx({
          sender: profile.uid,
          receiver: receiverUid,
          amount,
          message: message || null,
        });
        setResult(res);
      } else {
        const res = await transactionsService.executePrivateTx({
          sender: profile.uid,
          receiver: receiverUid,
          ciphertext,
          nonce,
          senderPublicKeyUsed: senderPubkey,
        });
        setResult(res);
      }
      setStep("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("form");
    setReceiverUid("");
    setAmount("");
    setMessage("");
    setCiphertext("");
    setNonce("");
    setSenderPubkey("");
    setResult(null);
    setError("");
  }

  if (!profile) return null;

  if (step === "result" && result) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-16 text-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${result.status === "success" ? "bg-green-100 dark:bg-green-900/40" : result.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
          {result.status === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600 dark:text-green-400">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-yellow-600 dark:text-yellow-400">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 capitalize">
          {result.status}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Transaction {result.uid.slice(0, 8)}... ({result.type})
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Send Money
      </h1>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["public", "private"] as TxMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              mode === m
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {step === "form" ? (
        <div className="space-y-4">
          {/* Recipient from friends */}
          {friends.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Select friend
              </label>
              <select
                value={receiverUid}
                onChange={(e) => setReceiverUid(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Choose a recipient...</option>
                {friends.map((f) => (
                  <option key={f.friend.uid} value={f.friend.uid}>
                    @{f.friend.username} ({f.friend.walletAddress.slice(0, 10)}...)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Or enter UID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Receiver UID
            </label>
            <input
              type="text"
              value={receiverUid}
              onChange={(e) => setReceiverUid(e.target.value)}
              placeholder="Paste UUID"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {mode === "public" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Message (optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's it for?"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ciphertext
                </label>
                <textarea
                  value={ciphertext}
                  onChange={(e) => setCiphertext(e.target.value)}
                  placeholder="Encrypted payload"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nonce
                </label>
                <input
                  type="text"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  placeholder="Nonce"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Sender public key
                </label>
                <input
                  type="text"
                  value={senderPubkey}
                  onChange={(e) => setSenderPubkey(e.target.value)}
                  placeholder="Your public key"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </>
          )}

          <button
            onClick={() => setStep("confirm")}
            disabled={!receiverUid || (mode === "public" && !amount)}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Confirm {mode} transaction
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">To</span>
                <span className="truncate text-zinc-900 dark:text-zinc-100">
                  {receiverUid.slice(0, 16)}...
                </span>
              </div>
              {mode === "public" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {amount}
                    </span>
                  </div>
                  {message && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Message</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {message}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Type</span>
                <span className="capitalize text-zinc-900 dark:text-zinc-100">
                  {mode}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Confirm & Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
