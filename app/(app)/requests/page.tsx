"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as requestsService from "@/lib/api/services/requests";
import * as tradesService from "@/lib/api/services/trades";
import * as friendshipsService from "@/lib/api/services/friendships";
import type {
  PaymentRequest,
  FriendshipListItem,
  CreateRequestBody,
} from "@/types/api";

type View = "create" | "incoming" | "outgoing";

export default function RequestsPage() {
  const { user, profile } = useAuth();
  const [view, setView] = useState<View>("incoming");
  const [incoming, setIncoming] = useState<PaymentRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [receiverUid, setReceiverUid] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        requestsService.listRequests({ receiver: profile.uid, status: "open" }),
        requestsService.listRequests({ sender: profile.uid }),
      ]);
      setIncoming(inRes.requests);
      setOutgoing(outRes.requests);
    } catch {
      setIncoming([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

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
    loadRequests();
    loadFriends();
  }, [loadRequests, loadFriends]);

  async function handleAccept(uid: string) {
    setActionLoading(uid);
    try {
      await requestsService.updateRequestStatus(uid, { status: "accepted" });
      await tradesService.executeTrade({ requestId: uid });
      await loadRequests();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(uid: string) {
    setActionLoading(uid);
    try {
      await requestsService.updateRequestStatus(uid, { status: "rejected" });
      await loadRequests();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(uid: string) {
    setActionLoading(uid);
    try {
      await requestsService.updateRequestStatus(uid, { status: "cancelled" });
      await loadRequests();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setCreateError("");
    setCreateSuccess(false);
    setCreateLoading(true);
    try {
      const body: CreateRequestBody = {
        sender: profile.uid,
        receiver: receiverUid,
        amount,
        message: message || null,
      };
      await requestsService.createRequest(body);
      setCreateSuccess(true);
      setReceiverUid("");
      setAmount("");
      setMessage("");
      await loadRequests();
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create request",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Requests
      </h1>

      {/* View tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["incoming", "outgoing", "create"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              view === v
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "create" ? (
        <form onSubmit={handleCreate} className="space-y-4">
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
                <option value="">Choose receiver...</option>
                {friends.map((f) => (
                  <option key={f.friend.uid} value={f.friend.uid}>
                    @{f.friend.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Receiver UID
            </label>
            <input
              type="text"
              value={receiverUid}
              onChange={(e) => setReceiverUid(e.target.value)}
              placeholder="UUID"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amount
            </label>
            <input
              type="text"
              required
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

          <button
            type="submit"
            disabled={createLoading || !amount}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {createLoading ? "Creating..." : "Create Request"}
          </button>

          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {createError}
            </p>
          )}
          {createSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Request created successfully
            </p>
          )}
        </form>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : view === "incoming" ? (
        incoming.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No incoming requests
          </p>
        ) : (
          <div className="space-y-2">
            {incoming.map((req) => (
              <div
                key={req.uid}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      From: {req.sender.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {req.message ?? "No message"} &middot;{" "}
                      {new Date(req.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {req.amount}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.uid)}
                    disabled={actionLoading === req.uid}
                    className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.uid)}
                    disabled={actionLoading === req.uid}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : outgoing.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No outgoing requests
        </p>
      ) : (
        <div className="space-y-2">
          {outgoing.map((req) => (
            <div
              key={req.uid}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    To: {req.receiver.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {req.message ?? "No message"} &middot;{" "}
                    {new Date(req.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {req.amount}
                  </p>
                  <StatusBadge status={req.status} />
                </div>
              </div>
              {req.status === "open" && (
                <button
                  onClick={() => handleCancel(req.uid)}
                  disabled={actionLoading === req.uid}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    accepted:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    expired:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {status}
    </span>
  );
}
