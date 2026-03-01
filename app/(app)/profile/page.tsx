"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as friendshipsService from "@/lib/api/services/friendships";
import type { FriendshipListItem } from "@/types/api";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<FriendshipListItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [search, setSearch] = useState("");
  const [addFriendUid, setAddFriendUid] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

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
      // silent failure
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Profile
      </h1>

      {/* Profile card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{profile.username}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <InfoRow label="Email" value={profile.email ?? user?.email ?? "—"} />
          <InfoRow label="Phone" value={profile.phoneNumber} />
          <InfoRow label="Wallet" value={profile.walletAddress} truncate />
        </div>
      </div>

      {/* Friends */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Friends
        </h2>

        {/* Add friend */}
        <form
          onSubmit={handleAddFriend}
          className="mb-4 flex gap-2"
        >
          <input
            type="text"
            value={addFriendUid}
            onChange={(e) => setAddFriendUid(e.target.value)}
            placeholder="Friend's UID"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {addError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">
            {addError}
          </p>
        )}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username..."
          className="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />

        {/* List */}
        {loadingFriends ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No friends yet
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div
                key={f.uid}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    @{f.friend.username}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {f.friend.phoneNumber}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFriend(f.friend.uid)}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Log out
      </button>
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
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span
        className={`text-right text-zinc-900 dark:text-zinc-100 ${truncate ? "truncate" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
