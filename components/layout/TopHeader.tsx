import Image from "next/image";

export default function TopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-100/60 bg-white/70 backdrop-blur-xl dark:border-amber-900/20 dark:bg-zinc-950/70">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="relative">
          <Image
            src="/favicon.ico"
            alt="Optimo logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white dark:ring-zinc-950" />
        </div>
        <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
          Optimo
        </span>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
    </header>
  );
}
