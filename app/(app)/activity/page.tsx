"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as requestsService from "@/lib/api/services/requests";
import * as transactionsService from "@/lib/api/services/transactions";
import * as friendshipsService from "@/lib/api/services/friendships";
import type {
  PaymentRequest,
  PrivateTransaction,
  FriendshipListItem,
} from "@/types/api";
import { CardSpotlight, EmptyState, Skeleton, TabBar } from "@/components/ui";

type MainTab = "transactions" | "requests";
type TxFilter = "success" | "failure" | "pending";
type ReqFilter = "sent" | "received" | "rejected";

const TX_FILTERS: TxFilter[] = ["success", "failure", "pending"];
const REQ_FILTERS: ReqFilter[] = ["sent", "received", "rejected"];

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20"
          : "bg-white/60 text-zinc-500 shadow-sm backdrop-blur-sm hover:text-zinc-700 hover:shadow-md dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default function ActivityPage() {
  const { user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>("transactions");
  const [txFilter, setTxFilter] = useState<TxFilter>("success");
  const [reqFilter, setReqFilter] = useState<ReqFilter>("sent");

  const [transactions, setTransactions] = useState<PrivateTransaction[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [friendsMap, setFriendsMap] = useState<Map<string, FriendshipListItem>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    friendshipsService
      .listFriendships(user.id)
      .then((res) => {
        const map = new Map<string, FriendshipListItem>();
        res.friendships.forEach((f) => map.set(f.friend.uid, f));
        setFriendsMap(map);
      })
      .catch(() => {});
  }, [user]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsService.listPrivateTxs({ status: txFilter });
      setTransactions(res.privateTransactions);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [txFilter]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params =
        reqFilter === "sent"
          ? { sender: user?.id }
          : reqFilter === "received"
            ? { receiver: user?.id }
            : { status: "rejected" as const };
      const res = await requestsService.listRequests(params);
      setRequests(res.requests);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [reqFilter, user?.id]);

  useEffect(() => {
    if (mainTab === "transactions") loadTransactions();
    else loadRequests();
  }, [mainTab, loadTransactions, loadRequests]);

  function resolveUser(uid: string) {
    const f = friendsMap.get(uid);
    if (f) {
      return {
        name: f.friend.username,
        username: `@${f.friend.username}`,
        initials: f.friend.username.slice(0, 2).toUpperCase(),
      };
    }
    return {
      name: uid.slice(0, 8),
      username: uid.slice(0, 12) + "…",
      initials: "??",
    };
  }

  const filteredTransactions = useMemo(() => transactions, [transactions]);
  const filteredRequests = useMemo(() => requests, [requests]);

  return (
    <div className="px-4 pt-6 pb-8 lg:px-8 lg:pt-10">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Activity
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Your transaction history</p>
      </div>

      <div className="mb-5 max-w-md">
        <TabBar
          tabs={["transactions", "requests"] as const}
          active={mainTab}
          onChange={setMainTab}
        />
      </div>

      <div className="mb-6 flex max-w-md gap-2">
        {mainTab === "transactions"
          ? TX_FILTERS.map((f) => (
              <FilterPill key={f} label={f} active={txFilter === f} onClick={() => setTxFilter(f)} />
            ))
          : REQ_FILTERS.map((f) => (
              <FilterPill key={f} label={f} active={reqFilter === f} onClick={() => setReqFilter(f)} />
            ))}
      </div>

      {loading ? (
        <div className="max-w-2xl">
          <Skeleton count={4} />
        </div>
      ) : mainTab === "transactions" ? (
        filteredTransactions.length === 0 ? (
          <EmptyState text="No transactions found" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTransactions.map((tx, i) => {
              const isSender = tx.sender === user?.id;
              const otherUid = isSender ? tx.receiver : tx.sender;
              const other = resolveUser(otherUid);
              const { date, time } = formatDateTime(tx.timestamp);

              return (
                <CardSpotlight
                  key={tx.uid}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300">
                      {other.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {other.name}
                      </p>
                      <p className="text-xs text-zinc-400">{other.username}</p>
                      <p className="text-[11px] text-zinc-300 dark:text-zinc-600">
                        {date} &middot; {time}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${isSender ? "text-red-500" : "text-emerald-500"}`}>
                        {isSender ? "−" : "+"} Private
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        )
      ) : filteredRequests.length === 0 ? (
        <EmptyState text="No requests found" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((req, i) => {
            const isSender = req.sender === user?.id;
            const otherUid = isSender ? req.receiver : req.sender;
            const other = resolveUser(otherUid);
            const { date, time } = formatDateTime(req.timestamp);
            const isDeclined = req.status === "rejected";

            return (
              <CardSpotlight
                key={req.uid}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300">
                    {other.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {other.name}
                    </p>
                    <p className="text-xs text-zinc-400">{other.username}</p>
                    <p className="text-[11px] text-zinc-300 dark:text-zinc-600">
                      {date} &middot; {time}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {isDeclined ? (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-800">
                        Declined
                      </span>
                    ) : (
                      <p className={`text-sm font-bold ${isSender ? "text-red-500" : "text-emerald-500"}`}>
                        {isSender ? "−" : "+"}
                        {req.amount}
                      </p>
                    )}
                    {req.message && (
                      <p className="max-w-[120px] truncate text-[11px] text-zinc-300 dark:text-zinc-600">
                        {req.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardSpotlight>
            );
          })}
        </div>
      )}
    </div>
  );
}
