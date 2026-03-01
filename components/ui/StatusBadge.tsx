const colorMap: Record<string, string> = {
  open: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800/50",
  accepted: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/50",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-200/50 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/50",
  cancelled: "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/50 dark:bg-zinc-800/50 dark:text-zinc-400 dark:ring-zinc-700/50",
  expired: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/50",
  pending: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/50",
  success: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/50",
  failure: "bg-red-50 text-red-600 ring-1 ring-red-200/50 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/50",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${colorMap[status] ?? "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200/50"}`}
    >
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
