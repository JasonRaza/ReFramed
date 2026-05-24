"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ErrorBoundary } from "./ErrorBoundary";
import { useOffline } from "@/hooks/useOffline";
import Sidebar from "./Sidebar";

// Routes that are full-screen game flows — sidebar is hidden there
const GAME_PREFIXES = [
  "/lobby",
  "/preview",
  "/pose",
  "/scoring",
  "/results",
  "/mirror",
  "/practice",
];

function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-red-600/95 px-4 py-2.5 text-center text-sm font-medium backdrop-blur-sm"
    >
      <span aria-hidden>📡</span>
      Pas de connexion — certaines fonctions peuvent ne pas marcher
    </div>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#0e0e0e]">
      <Sidebar />
      {/* Subtle radial glow — barely visible, breaks the flat black */}
      <div
        className="pointer-events-none fixed inset-0 md:left-[72px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(246,183,60,0.04) 0%, transparent 70%)",
        }}
      />
      {/* Main content — offset for sidebar (desktop) and bottom nav (mobile) */}
      <main className="relative z-10 flex-1 md:ml-[72px] pb-20 md:pb-0 overflow-y-auto min-w-0">
        <div className="mx-auto max-w-2xl px-6 md:px-10 py-6 flex flex-col min-h-dvh md:min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isGameRoute = GAME_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <ErrorBoundary>
      <OfflineBanner />
      {isGameRoute ? (
        children
      ) : (
        <ShellLayout>{children}</ShellLayout>
      )}
    </ErrorBoundary>
  );
}
