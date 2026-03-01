"use client";

import { useUnlink } from "@unlink-xyz/react";
import { useEffect, useState } from "react";

interface Friend {
  id: string;
  wallet_address: string;
  display_name: string;
  avatar_url?: string;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function FriendsList() {
  const { activeAccount } = useUnlink();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriend, setNewFriend] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadFriends() {
    if (!activeAccount) return;
    const res = await fetch(`/api/friends?wallet=${activeAccount.address}`);
    const data = await res.json();
    setFriends(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadFriends();
  }, [activeAccount]);

  async function addFriend() {
    if (!newFriend.trim() || !activeAccount) return;
    setAdding(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: activeAccount.address,
          friend_wallet: newFriend.trim(),
        }),
      });
      setNewFriend("");
      await loadFriends();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold">Friends</h2>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Friend's address"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addFriend}
          disabled={adding}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {friends.length === 0 && (
          <p className="text-xs text-gray-400">No friends yet</p>
        )}
        {friends.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {f.display_name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{f.display_name}</p>
              <p className="text-xs font-mono text-gray-400">{shortAddr(f.wallet_address)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
