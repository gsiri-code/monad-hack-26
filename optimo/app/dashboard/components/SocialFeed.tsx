"use client";

import { useEffect, useState } from "react";

interface FeedItem {
  id: string;
  sender: string;
  receiver: string;
  memo: string;
  visibility: string;
  created_at: string;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function SocialFeed({ wallet }: { wallet?: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = wallet
      ? `/api/social-feed?wallet=${wallet}`
      : "/api/social-feed";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setFeed(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [wallet]);

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading feed...</p>;
  }

  if (feed.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No payments yet. Send one!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {feed.map((item) => (
        <div key={item.id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {shortAddr(item.sender)}
              </span>
              <span className="text-gray-500 mx-1.5">paid</span>
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {shortAddr(item.receiver)}
              </span>
            </p>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1.5 text-gray-700">{item.memo}</p>
          <p className="mt-1 text-xs text-gray-400 capitalize">{item.visibility}</p>
          {/* No amount shown — by design */}
        </div>
      ))}
    </div>
  );
}
