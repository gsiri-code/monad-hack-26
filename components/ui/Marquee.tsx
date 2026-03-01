"use client";

import clsx from "clsx";

interface MarqueeProps {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

const speedMap = {
  slow: "40s",
  normal: "30s",
  fast: "20s",
};

export default function Marquee({
  children,
  reverse = false,
  className,
  speed = "normal",
}: MarqueeProps) {
  return (
    <div className={clsx("overflow-hidden", className)}>
      <div
        className={clsx(
          "flex w-max gap-4",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
        style={{ animationDuration: speedMap[speed] }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
