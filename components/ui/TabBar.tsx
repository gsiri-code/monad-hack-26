interface TabBarProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: TabBarProps<T>) {
  return (
    <div className="flex gap-1 rounded-2xl bg-zinc-100/80 p-1 dark:bg-zinc-800/80">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition-all duration-200 ${
            active === tab
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          {active === tab && (
            <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
          )}
          {tab}
        </button>
      ))}
    </div>
  );
}
