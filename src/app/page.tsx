"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModeRow from "@/components/ModeRow";
import RankBar from "@/components/RankBar";
import Avatar, {
  AVATARS,
  AVATAR_COLORS,
  getBg,
  parseAvatar,
} from "@/components/Avatar";
import { getProfile, saveProfile } from "@/hooks/useGameRoom";
import { getRankSnapshot, type RankSnapshot } from "@/lib/rank";
import type { Profile } from "@/lib/game";

// ─── Modes ────────────────────────────────────────────────────────────────────

const MODES = [
  { id: "duel",     label: "Duel",           sub: "1v1 en temps réel",              href: "/lobby" },
  { id: "mirror",   label: "Miroir",          sub: "Crée ta pose, l'autre l'imite",  href: "/lobby?mode=mirror" },
  { id: "practice", label: "Entraînement",    sub: "Mode solo",                      href: "/practice" },
  { id: "ranked",   label: "Classé",          sub: "Duel avec système de rang",      href: "/lobby?mode=ranked" },
  { id: "royale",   label: "Battle Royale",   sub: "8 joueurs — dernier debout",     href: "/lobby?mode=royale" },
] as const;

// ─── Profile Setup ────────────────────────────────────────────────────────────

function ProfileSetup({ onDone }: { onDone: (p: Profile) => void }) {
  const [emoji,    setEmoji]    = useState<string>(AVATARS[0]);
  const [colorKey, setColorKey] = useState<string>(AVATAR_COLORS[0].key);
  const [username, setUsername] = useState("");
  const avatar = `${emoji}|${colorKey}`;

  return (
    <div className="flex flex-col flex-1 gap-7">
      <div>
        <h1 className="text-2xl font-bold text-white">Crée ton profil</h1>
        <p className="mt-1 text-sm text-[#555]">Choisis un avatar et un pseudo</p>
      </div>

      <div className="flex justify-center py-2">
        <Avatar avatar={avatar} size="xl" />
      </div>

      <div>
        <p className="mb-2.5 text-xs font-medium text-[#555]">Ton animal</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setEmoji(a)}
              className={[
                "flex items-center justify-center rounded-xl aspect-square text-2xl transition-all duration-100",
                a === emoji ? "ring-2 ring-white/60 scale-105" : "bg-[#1a1a1a] hover:bg-[#222]",
              ].join(" ")}
              style={a === emoji ? { background: getBg(colorKey) } : {}}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-medium text-[#555]">Ta couleur</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={[
                "flex-1 h-8 rounded-full transition-all duration-100",
                c.key === colorKey
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e0e0e]"
                  : "opacity-50 hover:opacity-75",
              ].join(" ")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-medium text-[#555]">Pseudo</p>
        <input
          className="w-full rounded-lg bg-[#1a1a1a] border border-[#222] px-4 py-3 text-base font-medium text-white placeholder:text-[#333] focus:outline-none focus:border-[#444] transition-colors"
          maxLength={16}
          placeholder="Ex: SuperPoseur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && username.trim()) {
              onDone({ username: username.trim(), avatar });
            }
          }}
          autoFocus
        />
      </div>

      <div className="flex-1" />

      <button
        className="w-full rounded-lg bg-[#f6b73c] px-5 py-3.5 text-base font-semibold text-black active:opacity-80 disabled:opacity-30 transition-opacity"
        onClick={() => onDone({ username: username.trim(), avatar })}
        disabled={!username.trim()}
      >
        C&apos;est parti
      </button>
    </div>
  );
}

// ─── Mode Select ──────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Bronze:  "#cd7f32",
  Argent:  "#9ca3af",
  Or:      "#f6b73c",
  Platine: "#67e8f9",
  Diamant: "#818cf8",
  Légende: "#f472b6",
};

function ModeSelect({
  profile,
  onEditProfile,
}: {
  profile: Profile;
  onEditProfile: () => void;
}) {
  const router = useRouter();
  const [rank, setRank] = useState<RankSnapshot>(() => getRankSnapshot());

  useEffect(() => { setRank(getRankSnapshot()); }, []);

  const { emoji, colorKey } = parseAvatar(profile.avatar);
  const avatarBg   = getBg(colorKey);
  const rankColor  = RANK_COLORS[rank.label] ?? "#f6b73c";

  return (
    <div className="flex flex-col flex-1 gap-4">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">ReFramed</h1>
          <p className="text-[12px] text-[#555] mt-0.5">Choisis un mode</p>
        </div>

        {/* Avatar + name + rank */}
        <button
          onClick={onEditProfile}
          className="flex items-center gap-2.5 rounded-xl bg-[#1a1a1a] border border-[#222] pl-2 pr-3 py-2 transition-colors hover:bg-[#1f1f1f] active:bg-[#252525]"
        >
          {/* Coloured square avatar */}
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-base leading-none flex-shrink-0"
            style={{ background: avatarBg }}
          >
            {emoji}
          </span>
          <div className="text-left">
            <p className="text-[12px] font-semibold text-white leading-tight">{profile.username}</p>
            <p className="text-[10px] font-medium leading-tight" style={{ color: rankColor }}>
              {rank.label}
            </p>
          </div>
        </button>
      </div>

      {/* ── Mode list ──────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {MODES.map((mode) => (
          <ModeRow
            key={mode.id}
            id={mode.id}
            label={mode.label}
            sub={mode.sub}
            onClick={() => router.push(mode.href)}
          />
        ))}
      </div>

      {/* ── Rank bar ───────────────────────────────────── */}
      <RankBar rank={rank} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setReady(true);
  }, []);

  if (!ready) return null;

  function handleDone(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setEditing(false);
  }

  if (!profile || editing) {
    return <ProfileSetup onDone={handleDone} />;
  }

  return <ModeSelect profile={profile} onEditProfile={() => setEditing(true)} />;
}
