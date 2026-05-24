"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ErrorBoundary } from "./ErrorBoundary";
import { useOffline } from "@/hooks/useOffline";
import Sidebar from "./Sidebar";
import { getAuthUser } from "@/lib/auth";

// Full-screen routes — no sidebar, no auth guard
const FULLSCREEN_PREFIXES = [
  "/login",
  "/reset-password",
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
    <div data-themed className="flex min-h-dvh" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      {/* Subtle radial glow */}
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
  const router   = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const isFullscreen = FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // Skip auth check for login page itself
    if (pathname === "/login") { setAuthChecked(true); return; }

    getAuthUser().then((user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setAuthChecked(true);
      }
    });
  }, [pathname, router]);

  // Don't flash content while checking auth (except on login page)
  if (!authChecked && pathname !== "/login") {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#222] border-t-[#f6b73c]" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      {isFullscreen ? (
        children
      ) : (
        <ShellLayout>{children}</ShellLayout>
      )}
    </ErrorBoundary>
  );
}
