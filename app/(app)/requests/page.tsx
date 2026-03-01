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
import { Button, CardSpotlight, EmptyState, Input, Select, Skeleton, StatusBadge, TabBar } from "@/components/ui";

type View = "incoming" | "outgoing" | "create";

export default function RequestsPage() {
  const { profile } = useAuth();
  const [view, setView] = useState<View>("incoming");
  const [incoming, setIncoming] = useState<PaymentRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    } catch { /* silent */ } finally { setActionLoading(null); }
  }

  async function handleReject(uid: string) {
    setActionLoading(uid);
    try {
      await requestsService.updateRequestStatus(uid, { status: "rejected" });
      await loadRequests();
    } catch { /* silent */ } finally { setActionLoading(null); }
  }

  async function handleCancel(uid: string) {
    setActionLoading(uid);
    try {
      await requestsService.updateRequestStatus(uid, { status: "cancelled" });
      await loadRequests();
    } catch { /* silent */ } finally { setActionLoading(null); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setCreateError("");
    setCreateSuccess(false);
    setCreateLoading(true);
    try {
      const body: CreateRequestBody = { sender: profile.uid, receiver: receiverUid, amount, message: message || null };
      await requestsService.createRequest(body);
      setCreateSuccess(true);
      setReceiverUid("");
      setAmount("");
      setMessage("");
      await loadRequests();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setCreateLoading(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="px-4 pt-6 pb-8 lg:px-8 lg:pt-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Requests
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Manage payment requests</p>
      </div>

      <div className="mb-6 max-w-md">
        <TabBar tabs={["incoming", "outgoing", "create"] as const} active={view} onChange={setView} />
      </div>

      {view === "create" ? (
        <form onSubmit={handleCreate} className="max-w-lg space-y-4 animate-slide-up">
          {friends.length > 0 && (
            <Select label="Select friend" value={receiverUid} onChange={(e) => setReceiverUid(e.target.value)}>
              <option value="">Choose receiver...</option>
              {friends.map((f) => (
                <option key={f.friend.uid} value={f.friend.uid}>@{f.friend.username}</option>
              ))}
            </Select>
          )}
          <Input label="Receiver UID" value={receiverUid} onChange={(e) => setReceiverUid(e.target.value)} placeholder="UUID" />
          <Input label="Amount" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <Input label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's it for?" />
          <Button type="submit" disabled={createLoading || !amount} fullWidth>
            {createLoading ? "Creating..." : "Create Request"}
          </Button>
          {createError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{createError}</p>}
          {createSuccess && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">Request created successfully</p>}
        </form>
      ) : loading ? (
        <div className="max-w-2xl"><Skeleton className="h-20" /></div>
      ) : view === "incoming" ? (
        incoming.length === 0 ? (
          <EmptyState text="No incoming requests" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {incoming.map((req, i) => (
              <CardSpotlight key={req.uid} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-xs font-bold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300">
                        {req.sender.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{req.sender.slice(0, 8)}...</p>
                        <p className="text-xs text-zinc-400">{req.message ?? "No message"} &middot; {new Date(req.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{req.amount}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => handleAccept(req.uid)} disabled={actionLoading === req.uid} className="flex-1">Accept</Button>
                    <Button variant="danger" size="sm" onClick={() => handleReject(req.uid)} disabled={actionLoading === req.uid} className="flex-1">Reject</Button>
                  </div>
                </div>
              </CardSpotlight>
            ))}
          </div>
        )
      ) : outgoing.length === 0 ? (
        <EmptyState text="No outgoing requests" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outgoing.map((req, i) => (
            <CardSpotlight key={req.uid} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-xs font-bold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300">
                      {req.receiver.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{req.receiver.slice(0, 8)}...</p>
                      <p className="text-xs text-zinc-400">{req.message ?? "No message"} &middot; {new Date(req.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{req.amount}</p>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
                {req.status === "open" && (
                  <Button variant="secondary" size="sm" onClick={() => handleCancel(req.uid)} disabled={actionLoading === req.uid} fullWidth>Cancel</Button>
                )}
              </div>
            </CardSpotlight>
          ))}
        </div>
      )}
    </div>
  );
}
