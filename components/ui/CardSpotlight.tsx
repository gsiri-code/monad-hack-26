"use client";

import { useRef, useState, type HTMLAttributes } from "react";
import clsx from "clsx";

interface CardSpotlightProps extends HTMLAttributes<HTMLDivElement> {
  radius?: number;
  color?: string;
}

export default function CardSpotlight({
  children,
  radius = 300,
  color = "rgba(245, 158, 11, 0.12)",
  className,
  ...props
}: CardSpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/70 backdrop-blur-sm transition-colors duration-300 dark:border-zinc-800/60 dark:bg-zinc-900/70",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
