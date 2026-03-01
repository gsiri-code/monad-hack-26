"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as friendshipsService from "@/lib/api/services/friendships";
import * as usersService from "@/lib/api/services/users";
import type { FriendshipListItem, WalletBalance } from "@/types/api";
import { Button, CardSpotlight, Input, Skeleton } from "@/components/ui";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [search, setSearch] = useState("");
  const [addFriendUid, setAddFriendUid] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance[]>([]);

  const loadFriends = useCallback(async () => {
    if (!profile) return;
    setLoadingFriends(true);
    try {
      const params: { username?: string } = {};
      if (search) params.username = search;
      const res = await friendshipsService.listFriendships(profile.uid, params);
      setFriends(res.friendships);
    } catch {
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [profile, search]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (!profile) return;
    usersService.getWallet(profile.uid)
      .then((res) => setWallet(res.wallet))
      .catch(() => {});
  }, [profile]);

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !addFriendUid.trim()) return;
    setAddError("");
    setAddLoading(true);
    try {
      await friendshipsService.createFriendship(profile.uid, addFriendUid.trim());
      setAddFriendUid("");
      await loadFriends();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveFriend(friendUid: string) {
    if (!profile) return;
    try {
      await friendshipsService.deleteFriendship(profile.uid, friendUid);
      setFriends((prev) => prev.filter((f) => f.friend.uid !== friendUid));
    } catch {
      // silent
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function handleCopyWallet() {
    if (!profile) return;
    navigator.clipboard.writeText(profile.walletAddress);
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
  }

  if (!profile) return null;

  return (
    <div className="px-4 pt-6 pb-8 lg:px-8 lg:pt-10 animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: profile card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/40 bg-white/60 shadow-lg shadow-zinc-200/30 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/40 dark:shadow-black/10">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500" />
            <div className="absolute inset-x-0 top-[108px] h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />

            <div className="relative px-6 pt-16 pb-6">
              <div className="mb-4 flex h-18 w-18 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-amber-600 shadow-lg ring-4 ring-white dark:bg-zinc-800 dark:text-amber-400 dark:ring-zinc-800">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>

              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                @{profile.username}
              </p>

              <div className="mt-5 space-y-2.5">
                <InfoRow label="Email" value={profile.email ?? user?.email ?? "—"} />
                <InfoRow label="Phone" value={profile.phoneNumber} />
                <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50/80 px-3 py-2 dark:bg-zinc-800/40">
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Wallet
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {profile.walletAddress}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      className="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-700/40 dark:hover:text-zinc-300"
                      title="Copy wallet address"
                    >
                      {walletCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-500">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                          <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {wallet.length > 0 && (
                <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2.5 dark:from-amber-950/30 dark:to-orange-950/30">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Balance
                  </p>
                  {wallet.map((b) => (
                    <div key={b.currencyName} className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{b.currencyName}</span>
                      <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{b.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button variant="danger" onClick={handleLogout} fullWidth>
            Log out
          </Button>
        </div>

        {/* Right column: friends */}
        <div className="lg:col-span-3">
          <div className="mb-5">
            <h2 className="mb-1 text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              Friends
            </h2>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Manage your contacts</p>
          </div>

          <form onSubmit={handleAddFriend} className="mb-4 flex gap-2">
            <div className="flex-1">
              <Input
                value={addFriendUid}
                onChange={(e) => setAddFriendUid(e.target.value)}
                placeholder="Friend's UID"
              />
            </div>
            <Button type="submit" disabled={addLoading}>
              Add
            </Button>
          </form>
          {addError && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {addError}
            </p>
          )}

          <div className="mb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
            />
          </div>

          {loadingFriends ? (
            <Skeleton className="h-14" />
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-zinc-200/40 bg-white/40 py-16 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/30">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-zinc-300 dark:text-zinc-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-400">No friends yet</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {friends.map((f, i) => (
                <CardSpotlight
                  key={f.uid}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-xs font-bold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300">
                        {f.friend.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          @{f.friend.username}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          {f.friend.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(f.friend.uid)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                </CardSpotlight>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-zinc-50/80 px-3 py-2 dark:bg-zinc-800/40">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <span className={`text-right text-sm font-medium text-zinc-700 dark:text-zinc-300 ${truncate ? "truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}
