"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as requestsService from "@/lib/api/services/requests";
import * as transactionsService from "@/lib/api/services/transactions";
import type {
  PaymentRequest,
  PrivateTransaction,
  RequestStatus,
  ExecutionStatus,
} from "@/types/api";

type Tab = "requests" | "transactions";

const REQUEST_STATUSES: (RequestStatus | "all")[] = [
  "all",
  "open",
  "accepted",
  "rejected",
  "cancelled",
];

const TX_STATUSES: (ExecutionStatus | "all")[] = [
  "all",
  "pending",
  "success",
  "failure",
];

export default function ActivityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requests");
  const [reqStatus, setReqStatus] = useState<RequestStatus | "all">("all");
  const [txStatus, setTxStatus] = useState<ExecutionStatus | "all">("all");
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [transactions, setTransactions] = useState<PrivateTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = reqStatus === "all" ? {} : { status: reqStatus };
      const res = await requestsService.listRequests(params);
      setRequests(res.requests);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [reqStatus]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = txStatus === "all" ? {} : { status: txStatus };
      const res = await transactionsService.listPrivateTxs(params);
      setTransactions(res.privateTransactions);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [txStatus]);

  useEffect(() => {
    if (tab === "requests") loadRequests();
    else loadTransactions();
  }, [tab, loadRequests, loadTransactions]);

  return (
    <div className="mx-auto max-w-lg px-4 pt-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Activity
      </h1>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["requests", "transactions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(tab === "requests" ? REQUEST_STATUSES : TX_STATUSES).map(
          (status) => {
            const active =
              tab === "requests" ? reqStatus === status : txStatus === status;
            return (
              <button
                key={status}
                onClick={() =>
                  tab === "requests"
                    ? setReqStatus(status as RequestStatus | "all")
                    : setTxStatus(status as ExecutionStatus | "all")
                }
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {status}
              </button>
            );
          },
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <EmptyState text="No requests found" />
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.uid}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {req.sender === user?.id ? "Sent" : "Received"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {req.message ?? "No message"} &middot;{" "}
                    {new Date(req.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {req.amount}
                  </p>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : transactions.length === 0 ? (
        <EmptyState text="No transactions found" />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.uid}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {tx.sender === user?.id ? "Sent (private)" : "Received (private)"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(tx.timestamp).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={tx.status} />
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
    accepted: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    expired: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    failure: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
      {text}
    </p>
  );
}
