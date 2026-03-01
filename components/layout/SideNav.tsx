"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as requestsService from "@/lib/api/services/requests";

const NAV_ITEMS = [
  { href: "/messages", label: "Messages", icon: MessagesIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

export default function SideNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    requestsService
      .listRequests({ receiver: profile.uid, status: "open" })
      .then((res) => setPendingCount(res.requests.length))
      .catch(() => {});
  }, [profile]);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-zinc-200/30 bg-white/50 backdrop-blur-xl lg:flex dark:border-zinc-800/30 dark:bg-zinc-900/30">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="relative">
          <Image src="/favicon.ico" alt="Optimo" width={28} height={28} className="rounded-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white dark:ring-zinc-900" />
        </div>
        <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
          Optimo
        </span>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400"
                  : "text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/30 dark:hover:text-zinc-200"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-amber-500 to-orange-500" />
              )}
              <Icon active={active} />
              <span>{label}</span>
              {label === "Activity" && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Network status */}
      <div className="space-y-3 px-3 pb-4">
        <div className="rounded-xl border border-zinc-200/30 bg-zinc-50/50 p-3 dark:border-zinc-800/30 dark:bg-zinc-800/20">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Monad Network
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Block time</span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">&lt;1s</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">TPS</span>
            <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">10,000+</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/30 bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:border-amber-800/20 dark:from-amber-950/30 dark:to-orange-950/30">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            Private Payments
          </p>
          <p className="mt-0.5 text-[11px] text-amber-600/70 dark:text-amber-400/60">
            Powered by Monad
          </p>
        </div>
      </div>
    </aside>
  );
}

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function ActivityIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
