"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as usersService from "@/lib/api/services/users";
import type { CreateUserBody } from "@/types/api";

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
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create profile";
      setError(msg);
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Set up your profile
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Complete your profile to start transacting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, required, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {label}
                {required && <span className="text-red-500"> *</span>}
              </label>
              <input
                type="text"
                required={required}
                value={form[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Profile"}
          </button>
        </form>

        {error && (
          <p className="text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
