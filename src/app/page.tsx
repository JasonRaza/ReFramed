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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-12 gap-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-white">ReFramed</h1>
        <p className="mt-1 text-sm text-white/50">Crée ton profil pour commencer</p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center py-2">
        <Avatar avatar={avatar} size="xl" />
      </div>

      {/* Animal picker */}
      <div>
        <p className="mb-2.5 text-xs font-medium text-white/40">Ton animal</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setEmoji(a)}
              className={[
                "flex items-center justify-center rounded-xl aspect-square text-2xl transition-all duration-100",
                a === emoji
                  ? "ring-2 ring-white/60 scale-105"
                  : "bg-surface hover:bg-surface-hover active:scale-95",
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
        <p className="mb-2.5 text-xs font-medium text-white/40">Ta couleur</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={[
                "flex-1 h-8 rounded-full transition-all duration-100",
                c.key === colorKey
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]"
                  : "opacity-50 hover:opacity-75 active:scale-95",
              ].join(" ")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
      </div>

      {/* Username */}
      <div>
        <p className="mb-2.5 text-xs font-medium text-white/40">Pseudo</p>
        <input
          className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-base font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
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
        className="w-full rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white active:opacity-80 disabled:opacity-30 transition-opacity"
        onClick={handleConfirm}
        disabled={!username.trim()}
      >
        C&apos;est parti
      </button>
    </main>
  );
}

// ─── Mode cards ───────────────────────────────────────────────────────────────

const MODES = [
  {
    id: "duel" as const,
    icon: "⚔️",
    label: "Duel",
    sub: "1v1 en temps réel",
    href: "/lobby",
  },
  {
    id: "practice" as const,
    icon: "🎯",
    label: "Entraînement",
    sub: "Mode solo",
    href: "/practice",
  },
  {
    id: "mirror" as const,
    icon: "🪞",
    label: "Miroir",
    sub: "Crée ta pose, l'autre l'imite",
    href: "/lobby?mode=mirror",
  },
  {
    id: "ranked" as const,
    icon: "🏆",
    label: "Classé",
    sub: "Duel avec système de rang",
    href: "/lobby?mode=ranked",
  },
  {
    id: "royale" as const,
    icon: "👑",
    label: "Battle Royale",
    sub: "Jusqu'à 8 joueurs — dernier debout",
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-6 pt-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">ReFramed</h1>

        <button
          onClick={onEditProfile}
          className="flex items-center gap-2 rounded-xl bg-surface border border-surface-border px-3 py-2 active:bg-surface-hover transition-colors"
        >
          <Avatar avatar={profile.avatar} size="sm" />
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-tight">{profile.username}</p>
            <p className="text-[11px] text-amber-400 font-medium">{rank.label}</p>
          </div>
        </button>
      </div>

      {/* Tagline */}
      <p className="text-sm text-white/40 mb-5">
        Mémorise la pose en 5 sec, recrée-la en 15. Claude juge.
      </p>

      {/* Mode list */}
      <div className="flex flex-col gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => router.push(mode.href)}
            className="flex items-center gap-4 rounded-xl bg-surface border border-surface-border px-4 py-3.5 text-left active:bg-surface-hover transition-colors"
          >
            <span className="text-2xl w-8 text-center">{mode.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{mode.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{mode.sub}</p>
            </div>
            <span className="text-white/25 text-lg">›</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Rank card */}
      <div className="mt-6 rounded-xl bg-surface border border-surface-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-lg"
              style={{ background: getBg(colorKey) }}
            >
              {emoji}
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Rang actuel</p>
              <p className="text-sm font-bold text-amber-400">{rank.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tabular-nums text-white">{rank.points}</p>
            <p className="text-[11px] text-white/30">pts</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-700"
            style={{ width: `${rank.progress * 100}%` }}
          />
        </div>
        {rank.nextLabel && (
          <p className="mt-2 text-xs text-white/30 text-center">
            Prochain : <span className="text-amber-400/70">{rank.nextLabel}</span>
          </p>
        )}
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
