"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse, Profile } from "@/types/api";
import * as authService from "@/lib/api/services/auth";

interface AuthState {
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authService.getMe();
      setMe(data);
    } catch {
      setMe(null);
      setError("Not authenticated");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setMe(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: me ? { id: me.id, email: me.email } : null,
        profile: me?.profile ?? null,
        isLoading,
        error,
        refresh,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
