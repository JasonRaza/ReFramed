"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar, {
  AVATARS,
  AVATAR_COLORS,
  DEFAULT_AVATAR,
  getBg,
  parseAvatar,
} from "@/components/Avatar";
import { getProfile, saveProfile } from "@/hooks/useGameRoom";
import { getRankSnapshot, type RankSnapshot } from "@/lib/rank";
import type { Profile } from "@/lib/game";

// ─── Profile Setup ────────────────────────────────────────────────────────────

function ProfileSetup({ onDone }: { onDone: (p: Profile) => void }) {
  const [emoji, setEmoji] = useState<string>(AVATARS[0]);
  const [colorKey, setColorKey] = useState<string>(AVATAR_COLORS[0].key);
  const [username, setUsername] = useState("");

  const avatar = `${emoji}|${colorKey}`;

  function handleConfirm() {
    const name = username.trim();
    if (!name) return;
    onDone({ username: name, avatar });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-12 gap-7 animate-fade-up">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Bienvenue sur
          </p>
        </div>
        <h1 className="text-5xl font-black tracking-tight leading-none bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">ReFramed</h1>
        <p className="mt-3 text-sm font-medium text-white/50">Crée ton profil pour commencer</p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center py-2">
        <div className="relative">
          <Avatar avatar={avatar} size="xl" />
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 -z-10"
            style={{ background: getBg(colorKey) }}
          />
        </div>
      </div>

      {/* Animal picker */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
          Ton esprit animal
        </p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setEmoji(a)}
              className={[
                "flex items-center justify-center rounded-2xl aspect-square text-2xl transition-all duration-150",
                a === emoji
                  ? "ring-2 ring-white/80 scale-110 shadow-glow"
                  : "bg-white/[0.05] hover:bg-white/10 active:scale-95",
              ].join(" ")}
              style={a === emoji ? { background: getBg(colorKey) } : {}}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
          Ta couleur
        </p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={[
                "flex-1 h-9 rounded-full transition-all duration-150",
                c.key === colorKey
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0f0f14] scale-110"
                  : "opacity-60 hover:opacity-90 active:scale-95",
              ].join(" ")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
      </div>

      {/* Username */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
          Ton pseudo
        </p>
        <input
          className="w-full rounded-2xl bg-white/[0.07] border border-white/10 px-4 py-3 text-base font-semibold placeholder:text-white/20 focus:outline-none focus:border-purple-500 focus:bg-white/[0.09] transition-colors"
          maxLength={16}
          placeholder="Ex: SuperPoseur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
        />
      </div>

      <div className="flex-1" />

      <button
        className="min-h-[54px] w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold shadow-glow active:scale-[0.98] disabled:opacity-30 transition-all"
        onClick={handleConfirm}
        disabled={!username.trim()}
      >
        C&apos;est parti →
      </button>
    </main>
  );
}

// ─── Mode cards config ────────────────────────────────────────────────────────

const MODES = [
  {
    id: "duel" as const,
    icon: "⚔️",
    label: "Duel",
    sub: "Affronte un ami en temps réel",
    accent: "from-violet-600/20 to-purple-900/10",
    border: "border-violet-500/20",
    available: true,
    href: "/lobby",
  },
  {
    id: "practice" as const,
    icon: "🎯",
    label: "Entraînement",
    sub: "Perfectionne ta pose en solo",
    accent: "from-sky-600/20 to-blue-900/10",
    border: "border-sky-500/20",
    available: true,
    href: "/practice",
  },
  {
    id: "mirror" as const,
    icon: "🪞",
    label: "Miroir",
    sub: "Crée ta pose — l'autre l'imite",
    accent: "from-teal-600/20 to-emerald-900/10",
    border: "border-teal-500/20",
    available: true,
    href: "/lobby?mode=mirror",
  },
  {
    id: "ranked" as const,
    icon: "🏆",
    label: "Classé",
    sub: "Duel sérieux avec rang",
    accent: "from-amber-600/20 to-yellow-900/10",
    border: "border-amber-500/20",
    available: true,
    href: "/lobby?mode=ranked",
  },
  {
    id: "royale" as const,
    icon: "👑",
    label: "Battle Royale",
    sub: "Lobby jusqu'à 8 joueurs",
    accent: "from-rose-600/20 to-pink-900/10",
    border: "border-rose-500/20",
    available: true,
    href: "/lobby?mode=royale",
  },
] as const;

// ─── Mode Select ──────────────────────────────────────────────────────────────

function ModeSelect({
  profile,
  onEditProfile,
}: {
  profile: Profile;
  onEditProfile: () => void;
}) {
  const router = useRouter();
  const { emoji, colorKey } = parseAvatar(profile.avatar);
  const [rank, setRank] = useState<RankSnapshot>(() => getRankSnapshot());

  useEffect(() => {
    setRank(getRankSnapshot());
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-10 gap-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Sélection du mode
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">ReFramed</h1>
        </div>

        <button
          onClick={onEditProfile}
          className="group flex items-center gap-2.5 rounded-2xl bg-surface border border-surface-border shadow-glass px-3 py-2 active:scale-95 transition-all hover:bg-surface-hover"
        >
          <Avatar avatar={profile.avatar} size="sm" />
          <span className="flex max-w-[88px] flex-col text-left">
            <span className="truncate text-sm font-bold leading-tight text-white/90 group-hover:text-white transition-colors">{profile.username}</span>
            <span className="truncate text-[10px] font-black uppercase tracking-wider text-amber-400">
              {rank.label}
            </span>
          </span>
        </button>
      </div>

      {/* Tagline */}
      <p className="text-white/40 text-sm leading-relaxed mb-2 font-medium">
        Mémorise la pose en 5 sec, recrée-la en 15.{" "}
        <span className="text-white/70">Claude juge et roast.</span>
      </p>

      {/* Mode cards */}
      <div className="flex flex-col gap-3">
        {MODES.map((mode, i) => (
          <button
            key={mode.id}
            disabled={!mode.available}
            onClick={() => mode.href && router.push(mode.href)}
            className={[
              "group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-300",
              "animate-fade-up",
              mode.available
                ? `bg-surface border-surface-border shadow-glass hover:bg-surface-hover hover:border-white/20 active:scale-[0.98]`
                : "bg-white/[0.02] border-white/[0.04] opacity-40 cursor-not-allowed",
            ].join(" ")}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {mode.available && (
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${mode.accent}`} />
            )}
            
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] shadow-inner text-2xl group-hover:scale-110 transition-transform duration-300">
              {mode.icon}
            </div>
            
            <div className="flex-1 min-w-0 z-10">
              <p className="font-bold text-base leading-tight tracking-tight text-white/90 group-hover:text-white transition-colors">{mode.label}</p>
              <p className="text-white/40 text-xs mt-1 font-medium">{mode.sub}</p>
            </div>
            
            {mode.available ? (
              <span className="text-white/20 text-xl flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300 z-10">→</span>
            ) : (
              <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/30 flex-shrink-0 z-10">
                Bientôt
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Rank bar */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-surface shadow-glass p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg shadow-inner text-sm"
                style={{ background: getBg(colorKey) }}
              >
                {emoji}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 mb-0.5">
                  Rang Actuel
                </p>
                <p className="text-sm font-black uppercase tracking-wider text-amber-400">
                  {rank.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums tracking-tight text-white">{rank.points}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Points</p>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000 ease-out"
              style={{ width: `${rank.progress * 100}%` }}
            />
          </div>
          {rank.nextLabel && (
            <p className="mt-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
              Prochain rang : <span className="text-amber-400/80">{rank.nextLabel}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = getProfile();
    setProfile(existing);
    setReady(true);
  }, []);

  if (!ready) return null;

  function handleProfileDone(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setEditing(false);
  }

  if (!profile || editing) {
    return <ProfileSetup onDone={handleProfileDone} />;
  }

  return <ModeSelect profile={profile} onEditProfile={() => setEditing(true)} />;
}
