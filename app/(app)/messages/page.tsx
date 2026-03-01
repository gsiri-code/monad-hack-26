"use client";

import { useAuth } from "@/lib/auth-context";
import { Button, GridBackground, BackgroundBeams } from "@/components/ui";

const EXAMPLE_MESSAGES = [
  { role: "user" as const, text: "Send 50 USDC to @alice privately" },
  { role: "bot" as const, text: "Got it! Sending 50 USDC to @alice as a private transaction on Monad. Confirming..." },
  { role: "bot" as const, text: "Done! 50 USDC sent privately to @alice. Transaction settled in 0.4s." },
];

export default function MessagesPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <GridBackground className="min-h-[calc(100vh-4rem)]">
      <div className="px-4 pt-6 pb-8 lg:px-8 lg:pt-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Messages
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Talk to OpenClaw on Telegram to send private payments
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: chat preview */}
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/40 bg-white/50 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/30">
              <BackgroundBeams />

              {/* Chat header */}
              <div className="relative z-10 flex items-center gap-3 border-b border-zinc-200/40 px-5 py-4 dark:border-zinc-800/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-2.995a3.504 3.504 0 0 1-1.087-3.398V2.658Z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">OpenClaw Bot</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Online on Telegram</p>
                </div>
              </div>

              {/* Example conversation */}
              <div className="relative z-10 space-y-3 p-5">
                {EXAMPLE_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                <div className="flex justify-start animate-slide-up" style={{ animationDelay: "0.8s" }}>
                  <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800/60">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "0.2s" }} />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>

              {/* Input bar (decorative) */}
              <div className="relative z-10 border-t border-zinc-200/40 px-5 py-4 dark:border-zinc-800/40">
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl bg-zinc-100/80 px-4 py-2.5 text-sm text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500">
                    Message OpenClaw...
                  </div>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: explainer */}
          <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="rounded-2xl border border-zinc-200/40 bg-white/50 p-5 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/30">
              <h3 className="mb-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
                How OpenClaw works
              </h3>
              <div className="space-y-3">
                {[
                  { icon: "💬", text: "Tell OpenClaw what you want in plain English" },
                  { icon: "🧠", text: "NLP parses your intent — amount, recipient, privacy level" },
                  { icon: "⚡", text: "Transaction executes on Monad in under 1 second" },
                  { icon: "🔒", text: "Encrypted end-to-end, only visible to you and the recipient" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/40 bg-white/50 p-5 backdrop-blur-sm dark:border-zinc-800/40 dark:bg-zinc-900/30">
              <h3 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Try saying
              </h3>
              <div className="space-y-2">
                {[
                  '"Send 100 USDC to @bob privately"',
                  '"Request 25 DAI from @carol"',
                  '"What\'s my balance?"',
                  '"Show my recent transactions"',
                ].map((cmd, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-zinc-50/80 px-3 py-2 font-mono text-xs text-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400"
                  >
                    {cmd}
                  </div>
                ))}
              </div>
            </div>

            <Button fullWidth className="mt-2">
              Open Telegram
            </Button>
          </div>
        </div>
      </div>
    </GridBackground>
  );
}
