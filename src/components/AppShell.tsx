"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useOffline } from "@/hooks/useOffline";

// ─── Offline banner ───────────────────────────────────────────────────────────

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

// ─── AppShell ─────────────────────────────────────────────────────────────────

/**
 * Client-side root wrapper — used in layout.tsx to:
 *  1. Catch any unhandled render error (ErrorBoundary)
 *  2. Show a persistent offline banner when network drops
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      {children}
    </ErrorBoundary>
  );
}
