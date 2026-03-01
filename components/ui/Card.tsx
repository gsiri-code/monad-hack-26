import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
}

export default function Card({
  padded = true,
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/60 bg-white/70 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-zinc-800/60 dark:bg-zinc-900/50 ${
        hover ? "hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200/40 dark:hover:border-amber-700/30" : ""
      } ${padded ? "px-4 py-3" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
