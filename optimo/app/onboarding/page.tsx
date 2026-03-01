"use client";

import { useUnlink } from "@unlink-xyz/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Onboarding() {
  const { ready, activeAccount, createWallet, createAccount } = useUnlink();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<"name" | "creating" | "done">("name");
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }

    setStep("creating");
    setError("");

    try {
      await createWallet();
      await createAccount();

      const address = activeAccount?.address;
      if (!address) throw new Error("Wallet created but no address found");

      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          display_name: displayName.trim(),
        }),
      });

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
      setStep("name");
    }
  }

  if (!ready) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500">Initializing Unlink...</p>
      </main>
    );
  }

  if (activeAccount) {
    router.push("/dashboard");
    return null;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <h1 className="text-3xl font-bold">Welcome to Benmo</h1>
      <p className="text-gray-600 text-center max-w-md">
        Create a private wallet on Monad to send and receive payments without
        exposing your balances or transaction amounts.
      </p>

      {step === "name" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            Create Wallet
          </button>
        </div>
      )}

      {step === "creating" && (
        <p className="text-blue-600 font-medium">Creating your wallet...</p>
      )}

      {step === "done" && (
        <p className="text-green-600 font-medium">
          Wallet created! Redirecting to dashboard...
        </p>
      )}
    </main>
  );
}
