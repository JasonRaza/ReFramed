"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ChevronRight } from "lucide-react";
import Avatar, {
  AVATARS,
  AVATAR_COLORS,
  getBg,
  parseAvatar,
} from "@/components/Avatar";
import { signIn, signUp } from "@/lib/auth";
import { saveProfile } from "@/hooks/useGameRoom";
import type { Profile } from "@/lib/game";
import { cn } from "@/lib/utils";

// ─── Avatar picker (reused in signup) ────────────────────────────────────────

function AvatarPicker({
  emoji,
  colorKey,
  onEmoji,
  onColor,
}: {
  emoji: string;
  colorKey: string;
  onEmoji: (e: string) => void;
  onColor: (k: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <Avatar avatar={`${emoji}|${colorKey}`} size="lg" />
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onEmoji(a)}
            className={cn(
              "flex items-center justify-center rounded-lg aspect-square text-lg transition-all",
              a === emoji ? "ring-2 ring-white/60 scale-105" : "hover:bg-[var(--bg-hover)]",
            )}
            style={a === emoji ? { background: getBg(colorKey) } : { background: "var(--bg-surface)" }}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onColor(c.key)}
            className={cn(
              "flex-1 h-6 rounded-full transition-all",
              c.key === colorKey
                ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-surface-2)]"
                : "opacity-40 hover:opacity-70",
            )}
            style={{ background: c.bg }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  right,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <Icon size={15} className="absolute left-3.5" strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border pl-10 pr-10 py-3 text-sm focus:outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--text-muted)]"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--bg-border)",
          color: "var(--text-primary)",
        }}
        autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "off"}
      />
      {right && <div className="absolute right-3">{right}</div>}
    </div>
  );
}

// ─── Sign In form ─────────────────────────────────────────────────────────────

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn(email.trim(), password);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field
        icon={Mail}
        type="email"
        placeholder="Email"
        value={email}
        onChange={setEmail}
      />
      <Field
        icon={Lock}
        type={showPw ? "text" : "password"}
        placeholder="Mot de passe"
        value={password}
        onChange={setPassword}
        right={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
          </button>
        }
      />

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email || !password}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f6b73c] py-3 text-sm font-semibold text-black transition-opacity active:opacity-80 disabled:opacity-30"
      >
        {busy ? "Connexion…" : "Se connecter"}
        {!busy && <ChevronRight size={15} strokeWidth={2.5} />}
      </button>
    </form>
  );
}

// ─── Sign Up form ─────────────────────────────────────────────────────────────

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [username,    setUsername]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [emoji,       setEmoji]       = useState<string>(AVATARS[0]);
  const [colorKey,    setColorKey]    = useState<string>(AVATAR_COLORS[0].key);
  const [error,       setError]       = useState("");
  const [busy,        setBusy]        = useState(false);
  const [confirmed,   setConfirmed]   = useState(false); // email confirmation sent

  // ── Inline validation ──────────────────────────────────────────────────────
  const usernameOk  = username.trim().length >= 3;
  const passwordOk  = password.length >= 6;
  const hasSpecial  = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
  const hasNumber   = /\d/.test(password);

  function validate(): string | null {
    if (username.trim().length < 3)  return "Le pseudo doit faire au moins 3 caractères.";
    if (username.trim().length > 16) return "Le pseudo ne peut pas dépasser 16 caractères.";
    if (!email.includes("@"))        return "Adresse email invalide.";
    if (password.length < 6)         return "Le mot de passe doit faire au moins 6 caractères.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validErr = validate();
    if (validErr) { setError(validErr); return; }

    setBusy(true);
    setError("");

    const profile: Profile = { username: username.trim(), avatar: `${emoji}|${colorKey}` };
    const res = await signUp(email.trim(), password, profile);

    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    saveProfile(profile);

    if (res.needsConfirmation) {
      setConfirmed(true); // show "check your email" screen
      setBusy(false);
      return;
    }

    onSuccess();
  }

  // ── Email confirmation sent screen ─────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="py-4 text-center space-y-4">
        <div className="text-4xl">📬</div>
        <div>
          <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Vérifie ta boîte mail</p>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Un lien de confirmation a été envoyé à <span style={{ color: "var(--text-primary)" }}>{email}</span>.
            Clique dessus pour activer ton compte.
          </p>
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          Reviens ici une fois confirmé et connecte-toi via &quot;Se connecter&quot;.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Avatar picker */}
      <AvatarPicker
        emoji={emoji}
        colorKey={colorKey}
        onEmoji={setEmoji}
        onColor={setColorKey}
      />

      {/* Username */}
      <div className="space-y-1">
        <Field
          icon={User}
          type="text"
          placeholder="Pseudo"
          value={username}
          onChange={(v) => { setUsername(v); setError(""); }}
        />
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>3 à 16 caractères</p>
          {username.length > 0 && (
            <p className="text-[10px]" style={{ color: usernameOk ? undefined : "var(--text-faint)" }}>
              <span className={usernameOk ? "text-emerald-500" : ""}>{username.trim().length}/16</span>
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <Field
        icon={Mail}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(v) => { setEmail(v); setError(""); }}
      />

      {/* Password */}
      <div className="space-y-1">
        <Field
          icon={Lock}
          type={showPw ? "text" : "password"}
          placeholder="Mot de passe"
          value={password}
          onChange={(v) => { setPassword(v); setError(""); }}
          right={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="transition-colors"
            style={{ color: "var(--text-muted)" }}
            >
              {showPw ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
          }
        />
        {/* Password strength hints */}
        <div className="flex items-center gap-3 px-1">
          <span className={cn("text-[10px]", passwordOk ? "text-emerald-500" : "")} style={passwordOk ? undefined : { color: "var(--text-faint)" }}>
            {passwordOk ? "✓" : "·"} 6 caractères min.
          </span>
          <span className={cn("text-[10px]", hasNumber ? "text-emerald-500" : "")} style={hasNumber ? undefined : { color: "var(--text-faint)" }}>
            {hasNumber ? "✓" : "·"} Un chiffre
          </span>
          <span className={cn("text-[10px]", hasSpecial ? "text-emerald-500" : "")} style={hasSpecial ? undefined : { color: "var(--text-faint)" }}>
            {hasSpecial ? "✓" : "·"} Caractère spécial
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email || !passwordOk || !usernameOk}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f6b73c] py-3 text-sm font-semibold text-black transition-opacity active:opacity-80 disabled:opacity-30"
      >
        {busy ? "Création…" : "Créer mon compte"}
        {!busy && <ChevronRight size={15} strokeWidth={2.5} />}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");

  function onSuccess() {
    router.replace("/");
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10" style={{ background: "var(--bg-base)" }}>
      {/* Radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(246,183,60,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6b73c]/10 border border-[#f6b73c]/20 text-3xl">
            🎭
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>ReFramed</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>Imite la pose. Claude juge.</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface-2)", borderColor: "var(--bg-border-subtle)" }}>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: "var(--bg-border-subtle)" }}>
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "py-3 text-[13px] font-semibold transition-colors",
                  tab === t ? "border-b-2 border-[#f6b73c] -mb-px" : "",
                )}
                style={{ color: tab === t ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {t === "signin" ? "Se connecter" : "S'inscrire"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-5">
            {tab === "signin" ? (
              <SignInForm onSuccess={onSuccess} />
            ) : (
              <SignUpForm onSuccess={onSuccess} />
            )}
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          En continuant, tu acceptes les conditions d&apos;utilisation.
        </p>
      </div>
    </div>
  );
}
