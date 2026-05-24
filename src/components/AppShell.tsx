"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, BookOpen } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useOffline } from "@/hooks/useOffline";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/hooks/useLocale";
import Sidebar from "./Sidebar";
import Tutorial from "./Tutorial";
import { getAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const AUTH_REQUIRED_PREFIXES = ["/profile", "/rankings"];

const FULLSCREEN_PREFIXES = [
  "/login",
  "/reset-password",
  "/lobby",
  "/preview",
  "/pose",
  "/capture",
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

function TopBar({ onOpenTutorial }: { onOpenTutorial: () => void }) {
  const { theme, setTheme }   = useTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-end gap-2 px-6 md:px-10 py-3 border-b"
      style={{ background: "var(--bg-base)", borderColor: "var(--bg-border-subtle)" }}
    >
      {/* Tutorial button */}
      <button
        onClick={onOpenTutorial}
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--bg-border-subtle)]"
        style={{ borderColor: "var(--bg-border)", color: "var(--text-muted)" }}
      >
        <BookOpen size={13} strokeWidth={1.8} />
        {t.tutorialBtn}
      </button>

      {/* Language + theme controls */}
      <div data-tutorial="topbar-controls" className="flex items-center gap-2">
        {/* Language toggle */}
        <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--bg-border)" }}>
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-bold transition-colors",
                l === locale ? "bg-[#f6b73c] text-black" : "",
              )}
              style={l !== locale ? { background: "var(--bg-surface)", color: "var(--text-muted)" } : undefined}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-border-subtle)]"
          style={{ borderColor: "var(--bg-border)", color: "var(--text-muted)" }}
        >
          {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div data-themed className="flex min-h-dvh" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      <div
        className="pointer-events-none fixed inset-0 md:left-[200px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(246,183,60,0.04) 0%, transparent 70%)",
        }}
      />
      <main className="relative z-10 flex-1 md:ml-[200px] pb-20 md:pb-0 overflow-y-auto min-w-0">
        <TopBar onOpenTutorial={() => setShowTutorial(true)} />
        <div className="mx-auto max-w-2xl px-6 md:px-10 py-6 flex flex-col min-h-screen">
          {children}
        </div>
      </main>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const isFullscreen = FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p));
  const requiresAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!requiresAuth) { setAuthChecked(true); return; }
    setAuthChecked(false);
    getAuthUser().then((user) => {
      if (!user) router.replace("/login");
      else setAuthChecked(true);
    });
  }, [pathname, requiresAuth, router]);

  if (!authChecked && requiresAuth) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#222] border-t-[#f6b73c]" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      {isFullscreen ? children : <ShellLayout>{children}</ShellLayout>}
    </ErrorBoundary>
  );
}
