"use client";

import clsx from "clsx";

export default function GlowingBorder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("group relative", className)}>
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 opacity-30 blur-sm transition-all duration-500 group-hover:opacity-60 group-hover:blur-md" />
      <div className="relative rounded-2xl bg-white dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}
