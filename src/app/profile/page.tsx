"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Zap, Trophy, Star, TrendingUp, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import Avatar, {
  AVATARS,
  AVATAR_COLORS,
  getBg,
  parseAvatar,
} from "@/components/Avatar";
import { getProfile, saveProfile } from "@/hooks/useGameRoom";
import { getRankSnapshot, type RankSnapshot } from "@/lib/rank";
import type { Profile } from "@/lib/game";

// ─── Rank config ──────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Bronze:  "#cd7f32",
  Argent:  "#9ca3af",
  Or:      "#f6b73c",
  Platine: "#67e8f9",
  Diamant: "#818cf8",
  Légende: "#f472b6",
};

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({
  current,
  onSave,
  onCancel,
}: {
  current: Profile;
  onSave: (p: Profile) => void;
  onCancel: () => void;
}) {
  const parsed = parseAvatar(current.avatar);
  const [emoji,    setEmoji]    = useState<string>(parsed.emoji);
  const [colorKey, setColorKey] = useState<string>(parsed.colorKey);
  const [username, setUsername] = useState(current.username);
  const avatar = `${emoji}|${colorKey}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Modifier le profil</h2>
        <button
          onClick={onCancel}
          className="text-[12px] text-[#555] hover:text-[#888] transition-colors"
        >
          Annuler
        </button>
      </div>

      {/* Preview */}
      <div className="flex justify-center py-2">
        <Avatar avatar={avatar} size="xl" />
      </div>

      {/* Animal */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[#555] uppercase tracking-wider">Animal</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setEmoji(a)}
              className={[
                "flex items-center justify-center rounded-xl aspect-square text-xl transition-all duration-100",
                a === emoji ? "ring-2 ring-white/60 scale-105" : "bg-[#1a1a1a] hover:bg-[#222]",
              ].join(" ")}
              style={a === emoji ? { background: getBg(colorKey) } : {}}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[#555] uppercase tracking-wider">Couleur</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={[
                "flex-1 h-7 rounded-full transition-all duration-100",
                c.key === colorKey
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e0e0e]"
                  : "opacity-40 hover:opacity-70",
              ].join(" ")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
      </div>

      {/* Username */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-[#555] uppercase tracking-wider">Pseudo</p>
        <input
          className="w-full rounded-lg bg-[#1a1a1a] border border-[#222] px-4 py-2.5 text-sm font-medium text-white placeholder:text-[#333] focus:outline-none focus:border-[#444] transition-colors"
          maxLength={16}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && username.trim()) onSave({ username: username.trim(), avatar });
          }}
        />
      </div>

      <button
        className="w-full rounded-lg bg-[#f6b73c] py-3 text-sm font-semibold text-black transition-opacity active:opacity-80 disabled:opacity-30"
        onClick={() => onSave({ username: username.trim(), avatar })}
        disabled={!username.trim()}
      >
        Enregistrer
      </button>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-[#1a1a1a] border border-[#222] px-3.5 py-3">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${accent}18` }}
      >
        <Icon size={14} style={{ color: accent }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[18px] font-bold text-white tabular-nums leading-tight">{value}</p>
        <p className="text-[10px] text-[#555] mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rank,    setRank]    = useState<RankSnapshot | null>(null);
  const [editing, setEditing] = useState(false);
  const [stats,   setStats]   = useState({ games: 0, wins: 0, losses: 0, best: 0 });

  useEffect(() => {
    setProfile(getProfile());
    setRank(getRankSnapshot());
    const games  = parseInt(localStorage.getItem("rf_total_games")  ?? "0", 10);
    const wins   = parseInt(localStorage.getItem("rf_total_wins")   ?? "0", 10);
    const best   = parseInt(localStorage.getItem("rf_best_score")   ?? "0", 10);
    setStats({ games, wins, losses: Math.max(0, games - wins), best });
  }, []);

  function handleSave(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setEditing(false);
  }

  if (!profile || !rank) return null;

  const { emoji, colorKey } = parseAvatar(profile.avatar);
  const avatarBg  = getBg(colorKey);
  const rankColor = RANK_COLORS[rank.label] ?? "#f6b73c";
  const pct       = Math.round(rank.progress * 100);
  const winRate   = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (editing) {
    return (
      <EditPanel
        current={profile}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Profile card ───────────────────────────────── */}
      <div className="relative rounded-xl bg-[#1a1a1a] border border-[#222] px-5 py-5 flex items-center gap-4 overflow-hidden">
        {/* Subtle tinted background matching avatar colour */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: avatarBg }}
        />

        <Avatar avatar={profile.avatar} size="lg" />

        <div className="flex-1 min-w-0 relative">
          <p className="text-lg font-bold text-white truncate leading-tight">
            {profile.username}
          </p>
          <p className="text-[12px] mt-0.5 font-semibold" style={{ color: rankColor }}>
            {rank.label}
          </p>
          <p className="text-[11px] text-[#555] mt-1">
            {rank.points} pts
            {rank.nextLabel && (
              <span className="text-[#444]"> · {rank.nextLabel} dans {rank.nextLabel}</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#222] text-[#666] transition-colors hover:bg-[#2a2a2a] hover:text-[#aaa]"
          aria-label="Modifier le profil"
        >
          <Edit2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── XP bar ─────────────────────────────────────── */}
      <div className="rounded-lg bg-[#1a1a1a] border border-[#222] px-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Progression</p>
          <p className="text-[11px] text-[#555]">
            {rank.nextLabel
              ? <><span style={{ color: rankColor }}>{rank.points} pts</span> → <span className="text-[#888]">{rank.nextLabel}</span></>
              : <span style={{ color: rankColor }}>Rang maximum ✦</span>
            }
          </p>
        </div>
        <div className="relative h-2 rounded-full bg-[#111] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: rankColor }}
          />
        </div>
        <p className="text-[10px] text-[#444] mt-1.5 text-right">{pct}%</p>
      </div>

      {/* ── Stats grid ─────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-2.5">
          Statistiques
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={Zap}        label="Parties jouées"  value={stats.games}          accent="#f6b73c" />
          <StatCard icon={Trophy}     label="Victoires"       value={stats.wins}           accent="#1d9e75" />
          <StatCard icon={TrendingUp} label="Taux de victoire" value={`${winRate}%`}       accent="#7f77dd" />
          <StatCard icon={Star}       label="Meilleur score"  value={stats.best || "—"}    accent="#d85a30" />
        </div>
      </div>

      {/* ── Sign out ───────────────────────────────────── */}
      <button
        onClick={async () => { await signOut(); router.replace("/login"); }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#222] bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-[#555] transition-colors hover:border-red-500/30 hover:text-red-400"
      >
        <LogOut size={14} strokeWidth={1.8} />
        Se déconnecter
      </button>

      {/* ── Rank history placeholder ────────────────────── */}
      <div className="rounded-lg bg-[#1a1a1a] border border-[#222] px-4 py-3.5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Historique de rang</p>
        </div>
        {stats.games === 0 ? (
          <p className="text-[12px] text-[#444] text-center py-4">
            Joue ta première partie pour voir ton évolution 🎮
          </p>
        ) : (
          <div className="flex items-end gap-1 h-12">
            {/* Placeholder sparkline bars */}
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${30 + Math.sin(i * 0.8) * 20}%`,
                  background: i === 11 ? rankColor : "#2a2a2a",
                  opacity: 0.6 + i * 0.035,
                }}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
