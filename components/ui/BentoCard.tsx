"use client";

import { useRef, useState } from "react";
import clsx from "clsx";

interface BentoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  className?: string;
  span?: "1" | "2";
}

export default function BentoCard({
  title,
  description,
  icon,
  gradient,
  className,
  span = "1",
}: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className={clsx("group relative h-full", span === "2" ? "sm:col-span-2" : "", className)}>
      {/* Animated gradient border glow */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-amber-500/0 via-orange-500/0 to-amber-500/0 opacity-0 blur-sm transition-all duration-500 group-hover:from-amber-500/30 group-hover:via-orange-500/30 group-hover:to-amber-500/30 group-hover:opacity-100" />

      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="relative h-full overflow-hidden rounded-3xl border border-zinc-200/40 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800/40 dark:bg-zinc-900/40"
      >
        {/* Mouse-tracking spotlight */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: hovering
              ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245,158,11,0.1), transparent 60%)`
              : undefined,
          }}
        />

        {/* Decorative corner glow */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 blur-2xl transition-all duration-500 group-hover:from-amber-400/20 group-hover:to-orange-400/20" />

        <div className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-amber-500/20 transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="relative mb-1.5 text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="relative text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
