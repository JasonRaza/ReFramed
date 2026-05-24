"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Stage = "loading" | "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const router  = useRouter();
  const [stage,    setStage]    = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  // Supabase sends the recovery token in the URL hash as:
  //   #access_token=xxx&type=recovery
  // The Supabase client picks it up automatically on mount.
  useEffect(() => {
    if (!supabase) { setStage("invalid"); return; }

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStage("form");
      }
    });

    // Fallback: if hash is present but event fires before listener, check session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStage("form");
      else {
        // Give the auth state change a moment to fire
        setTimeout(() => {
          setStage((s) => s === "loading" ? "invalid" : s);
        }, 1500);
      }
    });
  }, []);

  const passwordOk = password.length >= 6;
  const matchOk    = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordOk)  { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (!matchOk)     { setError("Les mots de passe ne correspondent pas."); return; }
    if (!supabase)    { setError("Supabase non configuré."); return; }

    setBusy(true);
    setError("");

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(updateErr.message ?? "Une erreur est survenue.");
      setBusy(false);
      return;
    }

    setStage("success");
    setTimeout(() => router.replace("/"), 2000);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <Shell>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#222] border-t-[#f6b73c]" />
        <p className="text-[13px] text-[#555]">Vérification du lien…</p>
      </Shell>
    );
  }

  // ── Invalid / expired link ────────────────────────────────────────────────
  if (stage === "invalid") {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-[15px] font-bold text-white">Lien invalide ou expiré</p>
          <p className="text-[12px] text-[#555] leading-relaxed">
            Ce lien de réinitialisation n&apos;est plus valide.
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-2 rounded-lg bg-[#1a1a1a] border border-[#222] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#222] transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </Shell>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <Shell>
        <div className="text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="text-[15px] font-bold text-white">Mot de passe mis à jour !</p>
          <p className="text-[12px] text-[#555]">Redirection en cours…</p>
        </div>
      </Shell>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <Shell>
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6b73c]/10 border border-[#f6b73c]/20 text-3xl">
            🎭
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nouveau mot de passe</h1>
            <p className="text-[12px] text-[#555] mt-0.5">Choisis un mot de passe sécurisé</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[#111] border border-[#1e1e1e] p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* New password */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-[#555]" strokeWidth={1.8} />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full rounded-lg bg-[#1a1a1a] border border-[#222] pl-10 pr-10 py-3 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#3a3a3a] transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 text-[#555] hover:text-[#888] transition-colors"
                >
                  {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                </button>
              </div>
              <p className={cn("text-[10px] px-1", passwordOk ? "text-emerald-500" : "text-[#444]")}>
                {passwordOk ? "✓ 6 caractères minimum" : "· 6 caractères minimum"}
              </p>
            </div>

            {/* Confirm */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-[#555]" strokeWidth={1.8} />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Confirme le mot de passe"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  className="w-full rounded-lg bg-[#1a1a1a] border border-[#222] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#3a3a3a] transition-colors"
                />
              </div>
              {confirm.length > 0 && (
                <p className={cn("text-[10px] px-1", matchOk ? "text-emerald-500" : "text-red-400")}>
                  {matchOk ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !passwordOk || !matchOk}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f6b73c] py-3 text-sm font-semibold text-black transition-opacity active:opacity-80 disabled:opacity-30"
            >
              {busy ? "Mise à jour…" : "Confirmer le mot de passe"}
              {!busy && <ChevronRight size={15} strokeWidth={2.5} />}
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0e0e0e] flex flex-col items-center justify-center px-5 py-10">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(246,183,60,0.05) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6">
        {children}
      </div>
    </div>
  );
}
