import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:brightness-110 active:scale-[0.98]",
  secondary:
    "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger:
    "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98] dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
  ghost:
    "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:scale-[0.98] dark:hover:text-zinc-200 dark:hover:bg-zinc-800",
  success:
    "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 hover:brightness-110 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
