export default function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="h-8 w-8 text-amber-400 animate-float"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br from-amber-200/20 to-orange-200/20 blur-xl dark:from-amber-500/10 dark:to-orange-500/10" />
      </div>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
        {text}
      </p>
    </div>
  );
}
