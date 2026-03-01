"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as usersService from "@/lib/api/services/users";
import type { CreateUserBody } from "@/types/api";
import { Button, Input, GridBackground } from "@/components/ui";

export default function OnboardPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CreateUserBody>({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    walletAddress: "",
    encryptionPublicKey: "",
  });

  function update(field: keyof CreateUserBody, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = { ...form };
      if (!body.encryptionPublicKey) delete body.encryptionPublicKey;
      await usersService.createProfile(body);
      await refresh();
      router.replace("/messages");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof CreateUserBody; label: string; required: boolean; placeholder: string }[] = [
    { key: "username", label: "Username", required: true, placeholder: "satoshi" },
    { key: "firstName", label: "First name", required: true, placeholder: "Satoshi" },
    { key: "lastName", label: "Last name", required: true, placeholder: "Nakamoto" },
    { key: "phoneNumber", label: "Phone number", required: true, placeholder: "+1234567890" },
    { key: "walletAddress", label: "Wallet address", required: true, placeholder: "0x..." },
    { key: "encryptionPublicKey", label: "Encryption public key", required: false, placeholder: "Optional" },
  ];

  return (
    <GridBackground className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-7 w-7">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Set up your profile
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Complete your profile to start transacting
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-8 shadow-xl shadow-zinc-200/30 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ key, label, required, placeholder }) => (
                <div key={key} className={key === "walletAddress" || key === "encryptionPublicKey" ? "sm:col-span-2" : ""}>
                  <Input
                    label={label}
                    required={required}
                    value={form[key] ?? ""}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? "Creating..." : "Create Profile"}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </GridBackground>
  );
}
