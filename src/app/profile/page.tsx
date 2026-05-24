"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Zap, Trophy, Star, TrendingUp, LogOut } from "lucide-react";
import { signOut, saveProfileToDb, getAuthUser } from "@/lib/auth";
import Avatar, {
  AVATARS,
  AVATAR_COLORS,
  getBg,
  parseAvatar,
} from "@/components/Avatar";
import { getProfile, saveProfile } from "@/hooks/useGameRoom";
import { getRankSnapshot, type RankSnapshot } from "@/lib/rank";
import { supabase } from "@/lib/supabase";
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
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Modifier le profil</h2>
        <button
          onClick={onCancel}
          className="text-[12px] transition-colors hover:text-[var(--text-primary)]"
          style={{ color: "var(--text-muted)" }}
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
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Animal</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setEmoji(a)}
              className={[
                "flex items-center justify-center rounded-xl aspect-square text-xl transition-all duration-100",
                a === emoji ? "ring-2 ring-white/60 scale-105" : "hover:bg-[var(--bg-hover)]",
              ].join(" ")}
              style={a === emoji ? { background: getBg(colorKey) } : { background: "var(--bg-surface)" }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Couleur</p>
        <div className="flex gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={[
                "flex-1 h-7 rounded-full transition-all duration-100",
                c.key === colorKey
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-base)]"
                  : "opacity-40 hover:opacity-70",
              ].join(" ")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
      </div>

      {/* Username */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pseudo</p>
        <input
          className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[var(--text-faint)] transition-colors placeholder:text-[var(--text-faint)]"
          style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
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
    <div className="flex flex-col gap-2 rounded-lg border px-3.5 py-3" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${accent}18` }}
      >
        <Icon size={14} style={{ color: accent }} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[18px] font-bold tabular-nums leading-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>{label}</p>
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

    async function loadStats() {
      if (!supabase) return;
      const user = await getAuthUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("total_games, total_wins, best_score")
        .eq("id", user.id)
        .single();
      if (data) {
        const games = (data.total_games as number) ?? 0;
        const wins  = (data.total_wins  as number) ?? 0;
        setStats({ games, wins, losses: Math.max(0, games - wins), best: (data.best_score as number) ?? 0 });
      }
    }

    void loadStats();
  }, []);

  async function handleSave(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setEditing(false);
    // Sync to DB so the leaderboard reflects the new username/avatar
    const user = await getAuthUser();
    if (user) await saveProfileToDb(user.id, p);
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
      <div className="relative rounded-xl border px-5 py-5 flex items-center gap-4 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
        {/* Subtle tinted background matching avatar colour */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: avatarBg }}
        />

        <Avatar avatar={profile.avatar} size="lg" />

        <div className="flex-1 min-w-0 relative">
          <p className="text-lg font-bold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
            {profile.username}
          </p>
          <p className="text-[12px] mt-0.5 font-semibold" style={{ color: rankColor }}>
            {rank.label}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            {rank.points} pts
            {rank.nextLabel && (
              <span style={{ color: "var(--text-faint)" }}> · prochain : {rank.nextLabel}</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ background: "var(--bg-border)", color: "var(--text-muted)" }}
          aria-label="Modifier le profil"
        >
          <Edit2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── XP bar ─────────────────────────────────────── */}
      <div className="rounded-lg border px-4 py-3.5" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Progression</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {rank.nextLabel
              ? <><span style={{ color: rankColor }}>{rank.points} pts</span> → <span style={{ color: "var(--text-muted)" }}>{rank.nextLabel}</span></>
              : <span style={{ color: rankColor }}>Rang maximum ✦</span>
            }
          </p>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-border)" }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: rankColor }}
          />
        </div>
        <p className="text-[10px] mt-1.5 text-right" style={{ color: "var(--text-faint)" }}>{pct}%</p>
      </div>

      {/* ── Stats grid ─────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-muted)" }}>
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
        className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-medium transition-colors hover:border-red-500/30 hover:text-red-400"
        style={{ borderColor: "var(--bg-border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <LogOut size={14} strokeWidth={1.8} />
        Se déconnecter
      </button>

      {/* ── Rank history placeholder ────────────────────── */}
      <div className="rounded-lg border px-4 py-3.5" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Historique de rang</p>
        </div>
        {stats.games === 0 ? (
          <p className="text-[12px] text-center py-4" style={{ color: "var(--text-faint)" }}>
            Joue ta première partie pour voir ton évolution 🎮
          </p>
        ) : (
          <div className="flex items-end gap-1 h-12">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${30 + Math.sin(i * 0.8) * 20}%`,
                  background: i === 11 ? rankColor : "var(--bg-border)",
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
