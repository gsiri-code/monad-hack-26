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
import { Button, CardSpotlight, Input, Select, TabBar, Textarea } from "@/components/ui";

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
    const isSuccess = result.status === "success";
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 animate-fade-in">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className={`relative flex h-20 w-20 items-center justify-center rounded-3xl ${isSuccess ? "bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30" : "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"}`}>
            {isSuccess ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-emerald-500">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-amber-500">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
            )}
            <div className={`absolute -inset-2 -z-10 rounded-[2rem] blur-xl ${isSuccess ? "bg-emerald-200/30 dark:bg-emerald-500/10" : "bg-amber-200/30 dark:bg-amber-500/10"}`} />
          </div>
          <h2 className="text-xl font-extrabold capitalize text-zinc-900 dark:text-zinc-50">
            {result.status}
          </h2>
          <p className="text-sm text-zinc-400">
            Transaction {result.uid.slice(0, 8)}... ({result.type})
          </p>
          <Button onClick={reset}>Send another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 lg:px-8 lg:pt-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Send Money
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Transfer funds securely</p>
      </div>

      <div className="max-w-lg">
        <div className="mb-6">
          <TabBar tabs={["public", "private"] as const} active={mode} onChange={setMode} />
        </div>

        {step === "form" ? (
          <div className="space-y-4">
            {friends.length > 0 && (
              <Select
                label="Select friend"
                value={receiverUid}
                onChange={(e) => setReceiverUid(e.target.value)}
              >
                <option value="">Choose a recipient...</option>
                {friends.map((f) => (
                  <option key={f.friend.uid} value={f.friend.uid}>
                    @{f.friend.username} ({f.friend.walletAddress.slice(0, 10)}...)
                  </option>
                ))}
              </Select>
            )}

            <Input label="Receiver UID" value={receiverUid} onChange={(e) => setReceiverUid(e.target.value)} placeholder="Paste UUID" />

            {mode === "public" ? (
              <>
                <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                <Input label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's it for?" />
              </>
            ) : (
              <>
                <Textarea label="Ciphertext" value={ciphertext} onChange={(e) => setCiphertext(e.target.value)} placeholder="Encrypted payload" rows={3} />
                <Input label="Nonce" value={nonce} onChange={(e) => setNonce(e.target.value)} placeholder="Nonce" />
                <Input label="Sender public key" value={senderPubkey} onChange={(e) => setSenderPubkey(e.target.value)} placeholder="Your public key" />
              </>
            )}

            <Button onClick={() => setStep("confirm")} disabled={!receiverUid || (mode === "public" && !amount)} fullWidth>
              Review
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <CardSpotlight>
              <div className="p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Confirm {mode} transaction
                </h3>
                <div className="space-y-2.5 text-sm">
                  <ConfirmRow label="To" value={`${receiverUid.slice(0, 16)}...`} />
                  {mode === "public" && (
                    <>
                      <ConfirmRow label="Amount" value={amount} bold />
                      {message && <ConfirmRow label="Message" value={message} />}
                    </>
                  )}
                  <ConfirmRow label="Type" value={mode} />
                </div>
              </div>
            </CardSpotlight>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("form")} className="flex-1">Back</Button>
              <Button onClick={handleSend} disabled={loading} className="flex-1">
                {loading ? "Sending..." : "Confirm & Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between rounded-xl bg-zinc-50/80 px-3 py-2 dark:bg-zinc-800/40">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-zinc-900 dark:text-zinc-100" : "font-medium text-zinc-700 dark:text-zinc-300"} capitalize truncate`}>
        {value}
      </span>
    </div>
  );
}
