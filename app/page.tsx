"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AnimatedCounter,
  BentoCard,
  GridBackground,
  Spotlight,
  BackgroundBeams,
  Marquee,
  LivePulse,
  FloatingParticles,
} from "@/components/ui";
import TopHeader from "@/components/layout/TopHeader";

const FEATURE_PILLS = [
  "End-to-End Encrypted",
  "Instant Settlement",
  "NLP-Powered",
  "Telegram Integration",
  "Zero Fees",
  "Monad Native",
  "Sub-Second Finality",
  "10,000+ TPS",
];

const STATS = [
  {
    label: "Block Time",
    value: 1,
    suffix: "s",
    prefix: "<",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-500">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "TPS",
    value: 10000,
    suffix: "+",
    prefix: "",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-500">
        <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.431l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.484a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.312l-6.22 6.22a.75.75 0 0 1-1.06-1.061l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.606a12.695 12.695 0 0 1 5.68-4.974l1.086-.483-4.251-1.632a.75.75 0 0 1-.43-.969Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Network Fee",
    value: 0,
    suffix: "",
    prefix: "$",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-500">
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Privacy",
    value: 100,
    suffix: "%",
    prefix: "",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-500">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <GridBackground className="relative min-h-screen overflow-hidden">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#f59e0b" />
      <Spotlight className="top-20 right-0 md:top-0 md:right-40" fill="#fb923c" />
      <BackgroundBeams />
      <FloatingParticles count={40} />

      <TopHeader />

      {/* Feature marquee */}
      <div className="relative z-10 mt-4 opacity-50">
        <Marquee speed="slow">
          {FEATURE_PILLS.map((f, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-200/40 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{f}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-20 text-center lg:pt-24 lg:pb-24">
        <div className="animate-fade-in">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-50/50 px-4 py-1.5 backdrop-blur-sm dark:border-amber-800/30 dark:bg-amber-950/30">
            <LivePulse />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Live on Monad
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-zinc-50">
            Private payments,
            <br />
            <span className="animate-gradient-x bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-[length:200%_auto] bg-clip-text text-transparent">
              powered by Monad
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500 lg:text-xl dark:text-zinc-400">
            Send money privately on Monad. Message OpenClaw on Telegram, tell it
            what you need in plain English, and it handles the rest.
          </p>

          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "40px" }}>
            <Link
              href="/login"
              className="group bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-110 active:scale-[0.98]"
              style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "16px 48px", borderRadius: "9999px", fontSize: "16px", whiteSpace: "nowrap" }}
            >
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "20px", height: "20px", flexShrink: 0 }}>
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="border border-zinc-200/60 bg-white/50 font-semibold text-zinc-700 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 active:scale-[0.98] dark:border-zinc-700/40 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
              style={{ display: "inline-flex", alignItems: "center", padding: "16px 48px", borderRadius: "9999px", fontSize: "16px", whiteSpace: "nowrap" }}
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
        <div className="animate-scale-in" style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "16px" }}>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200/40 bg-white/60 shadow-sm backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/40"
              style={{ flex: "1 1 0%", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                {stat.icon}
              </div>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50" style={{ whiteSpace: "nowrap" }}>
                <AnimatedCounter
                  end={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </div>
              <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500" style={{ whiteSpace: "nowrap" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
        <div className="animate-slide-up">
          <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            How it works
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {[
              {
                step: "1",
                title: "Open Telegram",
                desc: "Message the OpenClaw bot",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-2.995a3.504 3.504 0 0 1-1.087-3.398V2.658Z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Say what you need",
                desc: '"Send 50 USDC to @alice privately"',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Done",
                desc: "Settled on Monad in under 1 second, fully encrypted",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                ),
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="group flex flex-1 flex-col items-center gap-4 rounded-2xl border border-zinc-200/40 bg-white/50 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800/40 dark:bg-zinc-900/30 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 transition-transform duration-200 group-hover:scale-110">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.title}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento feature grid */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Built Different
        </h2>
        <div
          className="grid grid-cols-1 gap-4 animate-slide-up lg:grid-cols-2"
          style={{ animationDelay: "0.15s" }}
        >
          <BentoCard
            title="Private by Default"
            description="Every transfer is encrypted end-to-end. Only you and the recipient know the details."
            gradient="from-amber-500 to-orange-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
            }
          />

          <BentoCard
            title="Monad Speed"
            description="Sub-second finality with 10,000+ TPS. Payments settle before you can blink."
            gradient="from-amber-500 to-orange-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
              </svg>
            }
          />

          <BentoCard
            title="OpenClaw + Telegram"
            description="Use natural language to send, request, or check balances. No crypto knowledge needed."
            gradient="from-amber-500 to-orange-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-2.995a3.504 3.504 0 0 1-1.087-3.398V2.658Z" />
                <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
              </svg>
            }
          />

          <BentoCard
            title="Zero Fees"
            description="No hidden charges. What you send is exactly what they receive."
            gradient="from-amber-500 to-orange-500"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-amber-100/60 bg-white/70 backdrop-blur-xl dark:border-amber-900/20 dark:bg-zinc-950/70">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image src="/favicon.ico" alt="Optimo logo" width={22} height={22} className="rounded-md" />
              <div className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-[1.5px] ring-white dark:ring-zinc-950" />
            </div>
            <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-sm font-extrabold text-transparent">
              Optimo
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Powered by Monad &middot; Built with OpenClaw
          </p>
        </div>
      </footer>
    </GridBackground>
  );
}
