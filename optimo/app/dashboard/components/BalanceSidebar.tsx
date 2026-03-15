"use client";

import { useUnlink } from "@unlink-xyz/react";
import { MON_TOKEN, USDC_MONAD } from "@/lib/constants";

function formatBalance(raw: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  return `${whole}.${frac.toString().padStart(decimals, "0").slice(0, 4)}`;
}

export function BalanceSidebar() {
  const { ready, balances, activeAccount } = useUnlink();

  if (!ready) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6">
        <p className="text-gray-400 text-sm">Loading balances...</p>
      </div>
    );
  }

  const monBalance = (balances as Record<string, bigint> | undefined)?.[MON_TOKEN] ?? 0n;
  const usdcBalance = (balances as Record<string, bigint> | undefined)?.[USDC_MONAD] ?? 0n;

  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold">Shielded Balance</h2>
        <p className="text-xs text-gray-400 mt-0.5">Only you can see this</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <span className="font-medium text-gray-700">MON</span>
          <span className="font-mono font-semibold">{formatBalance(monBalance, 18)}</span>
        </div>
        <div className="flex justify-between items-center bg-white rounded-xl px-4 py-3 shadow-sm">
          <span className="font-medium text-gray-700">USDC</span>
          <span className="font-mono font-semibold">{formatBalance(usdcBalance, 6)}</span>
        </div>
      </div>

      {activeAccount && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-medium">Your wallet</p>
          <p className="text-xs font-mono text-gray-600 truncate mt-0.5">
            {activeAccount.address}
          </p>
        </div>
      )}
    </div>
  );
}
