export default function BackgroundBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 left-1/4 h-[200%] w-px rotate-[35deg] bg-gradient-to-b from-transparent via-amber-500/20 to-transparent animate-beam" />
      <div
        className="absolute -top-1/2 left-1/2 h-[200%] w-px rotate-[35deg] bg-gradient-to-b from-transparent via-orange-500/15 to-transparent animate-beam"
        style={{ animationDelay: "2s", animationDuration: "10s" }}
      />
      <div
        className="absolute -top-1/2 left-3/4 h-[200%] w-px rotate-[35deg] bg-gradient-to-b from-transparent via-amber-400/10 to-transparent animate-beam"
        style={{ animationDelay: "4s", animationDuration: "12s" }}
      />
    </div>
  );
}
