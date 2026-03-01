import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
}

export default function Input({
  label,
  required,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
        >
          {label}
          {required && <span className="text-amber-500"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={`w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm placeholder-zinc-400 outline-none transition-all duration-200 focus:border-amber-400 focus:shadow-md focus:shadow-amber-500/10 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-amber-500 ${className}`}
        {...props}
      />
    </div>
  );
}
