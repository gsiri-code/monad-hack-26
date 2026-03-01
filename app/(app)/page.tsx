"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import * as usersService from "@/lib/api/services/users";
import * as requestsService from "@/lib/api/services/requests";
import type { WalletBalance, PaymentRequest } from "@/types/api";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    async function load() {
      setLoading(true);
      try {
        const [walletRes, reqRes] = await Promise.all([
          usersService.getWallet(profile!.uid),
          requestsService.listRequests({ status: "open", limit: 5 }),
        ]);
        setBalances(walletRes.wallet);
        setRequests(reqRes.requests);
      } catch {
        // handled gracefully — empty state shown
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Complete your profile
        </h2>
        <Link
          href="/onboard"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Set up profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-8">
      {/* Header */}
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back,
        </p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {profile.firstName} {profile.lastName}
        </h1>
      </div>

      {/* Wallet card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-indigo-200">Wallet Balance</p>
        {loading ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded bg-white/20" />
        ) : balances.length > 0 ? (
          <div className="mt-2 space-y-1">
            {balances.map((b) => (
              <p key={b.currencyName} className="text-3xl font-bold">
                {b.amount}{" "}
                <span className="text-lg font-medium text-indigo-200">
                  {b.currencyName}
                </span>
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-2xl font-bold">0.00 MON</p>
        )}
        <p className="mt-3 truncate text-xs text-indigo-200">
          {profile.walletAddress}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/send"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
          Send
        </Link>
        <Link
          href="/requests"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM1.75 14.5a.75.75 0 0 0 0 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 0 0-1.5 0v.784a.272.272 0 0 1-.35.25A49.043 49.043 0 0 0 1.75 14.5Z" clipRule="evenodd" />
          </svg>
          Request
        </Link>
      </div>

      {/* Recent open requests */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Open Requests
          </h2>
          <Link
            href="/requests"
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No open requests
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.uid}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {req.sender === user?.id ? "You sent" : "You received"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(req.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {req.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
