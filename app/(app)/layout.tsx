"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import BottomNav from "@/components/layout/BottomNav";
import TopHeader from "@/components/layout/TopHeader";
import SideNav from "@/components/layout/SideNav";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (!profile && pathname !== "/onboard") {
      router.replace("/onboard");
    }
  }, [user, profile, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-zinc-200 border-t-amber-500 dark:border-zinc-700" />
          <div className="absolute inset-1.5 animate-spin rounded-full border-[2px] border-zinc-100 border-b-orange-400 dark:border-zinc-800" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
        </div>
        <span className="text-xs font-medium text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <SideNav />
      <div className="min-h-screen pb-20 lg:pb-0 lg:pl-64">
        <div className="lg:hidden">
          <TopHeader />
        </div>
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
