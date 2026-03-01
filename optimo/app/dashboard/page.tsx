"use client";

import { useUnlink } from "@unlink-xyz/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BalanceSidebar } from "./components/BalanceSidebar";
import { FriendsList } from "./components/FriendsList";
import { PaymentModal } from "./components/PaymentModal";
import { SocialFeed } from "./components/SocialFeed";

export default function Dashboard() {
  const { ready, activeAccount } = useUnlink();
  const router = useRouter();
  const [showPayModal, setShowPayModal] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  if (!ready) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading Unlink...</p>
      </main>
    );
  }

  if (!activeAccount) {
    router.push("/onboarding");
    return null;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Benmo</h1>
        <button
          onClick={() => setShowPayModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700"
        >
          Pay
        </button>
      </header>

      <div className="flex gap-6">
        {/* Feed */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Feed</h2>
          </div>
          <SocialFeed key={feedKey} />
        </section>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 space-y-4">
          <BalanceSidebar />
          <FriendsList />
        </aside>
      </div>

      {showPayModal && (
        <PaymentModal
          onClose={() => setShowPayModal(false)}
          onSuccess={() => setFeedKey((k) => k + 1)}
        />
      )}
    </main>
  );
}
