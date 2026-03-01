"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/messages", label: "Messages", icon: MessagesIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
      <div className="border-t border-amber-100/40 bg-white/70 backdrop-blur-xl dark:border-amber-900/20 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                  active
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-amber-500/10 dark:bg-amber-400/10" />
                )}
                <Icon active={active} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="relative h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function ActivityIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="relative h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} className="relative h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
