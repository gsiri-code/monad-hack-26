interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = "h-16", count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`rounded-2xl bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%] animate-shimmer dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 ${className}`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
