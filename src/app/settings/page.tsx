"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Lock, Eye, EyeOff, ChevronRight, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/hooks/useLocale";
import { supabase } from "@/lib/supabase";
import { signOut, getAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wider"
         style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <div className="rounded-2xl border overflow-hidden"
           style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Row base ───────────────────────────────────────────────────────────────────

function Row({
  icon: Icon,
  label,
  children,
  onClick,
  last,
}: {
  icon?: React.ElementType;
  label: string;
  children?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 transition-colors",
        onClick && "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]",
        !last && "border-b",
      )}
      style={!last ? { borderColor: "var(--bg-border-subtle)" } : undefined}
    >
      {Icon && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
             style={{ background: "var(--bg-border)" }}>
          <Icon size={14} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
        </div>
      )}
      <span className="flex-1 text-left text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      {children}
    </Tag>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative h-7 w-12 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: on ? "#f6b73c" : "var(--bg-border)" }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
        style={{
          transition: "left 0.2s ease",
          left: on ? "2px" : "calc(100% - 22px)",
        }}
      />
    </button>
  );
}

// ── Password change form ───────────────────────────────────────────────────────

function PasswordForm({ t, onClose }: {
  t: ReturnType<typeof import("@/hooks/useLocale").useLocale>["t"];
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  const passwordOk = password.length >= 6;
  const matchOk    = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk || !matchOk) return;
    if (!supabase) { setError("Supabase non configuré."); return; }

    setBusy(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    setDone(true);
    setBusy(false);
    setTimeout(onClose, 1500);
  }

  if (done) {
    return (
      <div className="px-4 pb-4 flex items-center gap-2 text-emerald-500 text-[13px] font-medium">
        <span>✓</span> {t.updated}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 flex flex-col gap-3">
      {/* New password */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <Lock size={14} className="absolute left-3 text-[#555]" strokeWidth={1.8} />
          <input
            type={showPw ? "text" : "password"}
            placeholder={t.newPassword}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="w-full rounded-lg border pl-9 pr-9 py-2.5 text-sm focus:outline-none transition-colors"
            style={{
              background: "var(--bg-base)",
              borderColor: "var(--bg-border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3"
            style={{ color: "var(--text-muted)" }}
          >
            {showPw ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
          </button>
        </div>
        <p className={cn("text-[10px] px-1", passwordOk ? "text-emerald-500" : "text-[#555]")}>
          {passwordOk ? `✓ ${t.passwordMin}` : `· ${t.passwordMin}`}
        </p>
      </div>

      {/* Confirm */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <Lock size={14} className="absolute left-3 text-[#555]" strokeWidth={1.8} />
          <input
            type={showPw ? "text" : "password"}
            placeholder={t.confirmPassword}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            className="w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{
              background: "var(--bg-base)",
              borderColor: "var(--bg-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        {confirm.length > 0 && (
          <p className={cn("text-[10px] px-1", matchOk ? "text-emerald-500" : "text-red-400")}>
            {matchOk ? `✓ ${t.passwordMatch}` : `✗ ${t.passwordNoMatch}`}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium transition-colors"
          style={{
            borderColor: "var(--bg-border)",
            color: "var(--text-muted)",
            background: "var(--bg-surface)",
          }}
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={busy || !passwordOk || !matchOk}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#f6b73c] py-2.5 text-[13px] font-semibold text-black transition-opacity disabled:opacity-30"
        >
          {busy ? t.updating : t.update}
          {!busy && <ChevronRight size={13} strokeWidth={2.5} />}
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router                = useRouter();
  const { theme, setTheme }   = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [pwOpen, setPwOpen]   = useState(false);
  const [isAuth, setIsAuth]   = useState(false);

  useEffect(() => {
    getAuthUser().then((u) => setIsAuth(!!u));
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {t.settings}
        </h1>
      </div>

      {/* ── Apparence ─────────────────────────────────── */}
      <Section title={t.appearance}>
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label={theme === "dark" ? t.darkMode : t.lightMode}
          last
        >
          <Toggle
            on={theme === "light"}
            onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        </Row>
      </Section>

      {/* ── Compte ────────────────────────────────────── */}
      <Section title={t.account}>
        <Row
          icon={Lock}
          label={t.changePassword}
          onClick={() => setPwOpen((v) => !v)}
          last={!pwOpen}
        >
          {pwOpen
            ? <ChevronDown size={15} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
            : <ChevronRight size={15} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
          }
        </Row>

        {/* Expandable password form */}
        {pwOpen && (
          <PasswordForm
            t={t}
            onClose={() => setPwOpen(false)}
          />
        )}
      </Section>

      {/* ── Langue ────────────────────────────────────── */}
      <Section title={t.language}>
        <Row icon={undefined} label={t.language} last>
          <div className="flex rounded-lg overflow-hidden border"
               style={{ borderColor: "var(--bg-border)" }}>
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "px-4 py-1.5 text-[12px] font-semibold transition-colors",
                  l === locale
                    ? "bg-[#f6b73c] text-black"
                    : "text-[#555] hover:text-[#888]",
                )}
                style={l !== locale ? { background: "var(--bg-surface)" } : undefined}
              >
                {l === "fr" ? "FR" : "EN"}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* ── Déconnexion ───────────────────────────────── */}
      {isAuth && (
        <button
          onClick={async () => { await signOut(); router.replace("/login"); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-medium transition-colors hover:border-red-500/30 hover:text-red-400"
          style={{ borderColor: "var(--bg-border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
        >
          <LogOut size={14} strokeWidth={1.8} />
          {t.signOutBtn}
        </button>
      )}

    </div>
  );
}
