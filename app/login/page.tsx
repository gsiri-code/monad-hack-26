"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as authService from "@/lib/api/services/auth";
import { Button, Input, Spotlight, GridBackground } from "@/components/ui";
import { FloatingParticles } from "@/components/ui";
import TopHeader from "@/components/layout/TopHeader";

type Step = "email" | "otp";
type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.sendOtp(email);
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.verifyOtp(email, code);
      router.replace("/messages");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GridBackground className="relative flex min-h-screen flex-col overflow-hidden">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#f59e0b" />
      <FloatingParticles count={20} />

      <TopHeader />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Back link */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Back to home
          </Link>

          {/* Auth card */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white/60 p-8 shadow-2xl shadow-zinc-300/20 backdrop-blur-md lg:p-10 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:shadow-black/30">
            {/* Mode toggle */}
            {step === "email" && (
              <div className="mb-6 flex rounded-xl bg-zinc-100/80 p-1 dark:bg-zinc-800/80">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    mode === "signin"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    mode === "signup"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
              {mode === "signin" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                  <path d="M6.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM3.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM19.75 7.5a.75.75 0 0 0-1.5 0v2.25H16a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H22a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
                </svg>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {step === "otp"
                  ? "Check your email"
                  : mode === "signin"
                    ? "Welcome back"
                    : "Create your account"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {step === "otp"
                  ? `We sent an 8-digit code to ${email}`
                  : mode === "signin"
                    ? "Enter the email associated with your account"
                    : "Enter your email to get started with Optimo"}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  label="Email"
                />
                <Button type="submit" disabled={loading} fullWidth>
                  {loading ? "Sending..." : mode === "signin" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="00000000"
                  autoFocus
                  label="Verification code"
                  className="text-center text-lg tracking-[0.3em]"
                />
                <Button type="submit" disabled={loading} fullWidth>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("email")}
                  fullWidth
                >
                  Use a different email
                </Button>
              </form>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            By continuing, you agree to Optimo&apos;s Terms and Privacy Policy
          </p>
        </div>
      </div>
    </GridBackground>
  );
}
