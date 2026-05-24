"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, Check, Users, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { getRankSnapshot } from "@/lib/rank";
import { cn } from "@/lib/utils";

// ── Rank helpers ──────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Bronze:  "#cd7f32",
  Argent:  "#9ca3af",
  Or:      "#f6b73c",
  Platine: "#67e8f9",
  Diamant: "#818cf8",
  Légende: "#f472b6",
};

const RANK_THRESHOLDS = [
  { label: "Bronze",  min: 0    },
  { label: "Argent",  min: 900  },
  { label: "Or",      min: 1100 },
  { label: "Platine", min: 1300 },
  { label: "Diamant", min: 1550 },
  { label: "Légende", min: 1850 },
];

function rankLabel(points: number): string {
  return [...RANK_THRESHOLDS].reverse().find((r) => points >= r.min)?.label ?? "Bronze";
}

// ── Types ──────────────────────────────────────────────────────────────────────

type LeaderEntry = {
  id:          string;
  username:    string;
  avatar:      string;
  rank_points: number;
  isMe:        boolean;
};

type SearchEntry = {
  id:          string;
  username:    string;
  avatar:      string;
  rank_points: number;
  isFriend:    boolean;
  isMe:        boolean;
};

// ── Medal / position badge ─────────────────────────────────────────────────────

function PosBadge({ pos, isMe }: { pos: number; isMe: boolean }) {
  if (pos === 1) return <span className="text-base leading-none">🥇</span>;
  if (pos === 2) return <span className="text-base leading-none">🥈</span>;
  if (pos === 3) return <span className="text-base leading-none">🥉</span>;
  return (
    <span className="text-[12px] font-bold tabular-nums w-5 text-center" style={{ color: isMe ? "#f6b73c" : "var(--text-muted)" }}>
      {pos}
    </span>
  );
}

// ── Leaderboard row ────────────────────────────────────────────────────────────

function LeaderRow({ entry, pos }: { entry: LeaderEntry; pos: number }) {
  const label = rankLabel(entry.rank_points);
  const color = RANK_COLORS[label] ?? "#f6b73c";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors border",
        entry.isMe ? "bg-[#f6b73c]/8 border-[#f6b73c]/20" : "",
      )}
      style={!entry.isMe ? { background: "var(--bg-surface)", borderColor: "var(--bg-border)" } : undefined}
    >
      {/* Position */}
      <div className="flex items-center justify-center w-6 flex-shrink-0">
        <PosBadge pos={pos} isMe={entry.isMe} />
      </div>

      {/* Avatar */}
      <Avatar avatar={entry.avatar} size="sm" />

      {/* Name + rank */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: entry.isMe ? "#f6b73c" : "var(--text-primary)" }}>
          {entry.username}
          {entry.isMe && <span className="ml-1.5 text-[10px] font-medium text-[#f6b73c]/60">(toi)</span>}
        </p>
        <p className="text-[10px] font-medium" style={{ color }}>{label}</p>
      </div>

      {/* Points */}
      <p className="text-[12px] font-bold tabular-nums flex-shrink-0" style={{ color: "var(--text-primary)" }}>
        {entry.rank_points} <span className="font-normal" style={{ color: "var(--text-muted)" }}>pts</span>
      </p>
    </div>
  );
}

// ── Search result row ──────────────────────────────────────────────────────────

function SearchRow({
  entry,
  onAdd,
  onRemove,
  loading,
}: {
  entry:    SearchEntry;
  onAdd:    (id: string) => void;
  onRemove: (id: string) => void;
  loading:  boolean;
}) {
  const label = rankLabel(entry.rank_points);
  const color = RANK_COLORS[label] ?? "#f6b73c";

  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
      <Avatar avatar={entry.avatar} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{entry.username}</p>
        <p className="text-[10px] font-medium" style={{ color }}>{label} · {entry.rank_points} pts</p>
      </div>

      {!entry.isMe && (
        entry.isFriend ? (
          <button
            onClick={() => onRemove(entry.id)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
            style={{ background: "var(--bg-border)", borderColor: "var(--bg-border-subtle)", color: "var(--text-muted)" }}
          >
            <Check size={12} strokeWidth={2.5} />
            Ami
          </button>
        ) : (
          <button
            onClick={() => onAdd(entry.id)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#f6b73c]/10 border border-[#f6b73c]/25 px-3 py-1.5 text-[11px] font-medium text-[#f6b73c] transition-colors hover:bg-[#f6b73c]/20 disabled:opacity-40"
          >
            <UserPlus size={12} strokeWidth={2.5} />
            Ajouter
          </button>
        )
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const [myId,        setMyId]        = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [friendIds,   setFriendIds]   = useState<Set<string>>(new Set());
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<SearchEntry[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init: sync rank + load leaderboard ──────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    async function init() {
      const user = await getAuthUser();
      if (!user) { setLoading(false); return; }
      setMyId(user.id);

      // Sync localStorage rank_points → DB
      const localPoints = getRankSnapshot().points;
      await supabase!
        .from("user_profiles")
        .update({ rank_points: localPoints })
        .eq("id", user.id);

      await loadLeaderboard(user.id);
      setLoading(false);
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLeaderboard(userId: string) {
    if (!supabase) return;

    // Get friend IDs
    const { data: fData } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);

    const ids = new Set<string>((fData ?? []).map((r: { friend_id: string }) => r.friend_id));
    setFriendIds(ids);

    // Get profiles: me + friends
    const allIds = [userId, ...Array.from(ids)];
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, username, avatar, rank_points")
      .in("id", allIds);

    if (!profiles) return;

    const entries: LeaderEntry[] = (profiles as { id: string; username: string; avatar: string; rank_points: number }[])
      .map((p) => ({ ...p, isMe: p.id === userId }))
      .sort((a, b) => b.rank_points - a.rank_points);

    setLeaderboard(entries);
  }

  // ── Search with debounce ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearching(true);

    searchTimeout.current = setTimeout(async () => {
      if (!supabase || !myId) { setSearching(false); return; }

      // RPC function searches auth.users by email (SECURITY DEFINER — emails never exposed)
      const { data } = await supabase
        .rpc("find_profile_by_email", { search_email: query.trim() });

      const entries: SearchEntry[] = (data ?? []).map((p: { id: string; username: string; avatar: string; rank_points: number }) => ({
        ...p,
        isFriend: friendIds.has(p.id),
        isMe: p.id === myId,
      }));

      setResults(entries);
      setSearching(false);
    }, 350);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, myId, friendIds]);

  // ── Add / Remove friend ──────────────────────────────────────────────────────
  async function handleAdd(friendId: string) {
    if (!supabase || !myId) return;
    setActionId(friendId);
    await supabase.from("friendships").insert({ user_id: myId, friend_id: friendId });
    const next = new Set(friendIds);
    next.add(friendId);
    setFriendIds(next);
    // Refresh leaderboard to include new friend
    await loadLeaderboard(myId);
    setActionId(null);
  }

  async function handleRemove(friendId: string) {
    if (!supabase || !myId) return;
    setActionId(friendId);
    await supabase
      .from("friendships")
      .delete()
      .eq("user_id", myId)
      .eq("friend_id", friendId);
    const next = new Set(friendIds);
    next.delete(friendId);
    setFriendIds(next);
    setLeaderboard((prev) => prev.filter((e) => e.id !== friendId || e.isMe));
    setActionId(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const isSearching = query.trim().length > 0;
  const myPos = leaderboard.findIndex((e) => e.isMe) + 1;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Classement</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>Amis · Points de rang</p>
      </div>

      {/* ── Search bar ─────────────────────────────────── */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3.5" strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
        <input
          type="email"
          placeholder="Rechercher par courriel…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border pl-10 pr-10 py-3 text-sm placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--text-faint)] transition-colors"
          style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)", color: "var(--text-primary)" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* ── Search results ─────────────────────────────── */}
      {isSearching && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {searching ? "Recherche…" : results.length === 0 ? "Aucun résultat" : `${results.length} résultat${results.length !== 1 ? "s" : ""}`}
          </p>
          {!searching && results.length === 0 && (
            <p className="text-center text-[13px] py-6" style={{ color: "var(--text-faint)" }}>Aucun joueur trouvé</p>
          )}
          {results.map((r) => (
            <SearchRow
              key={r.id}
              entry={{ ...r, isFriend: friendIds.has(r.id) }}
              onAdd={handleAdd}
              onRemove={handleRemove}
              loading={actionId === r.id}
            />
          ))}
        </div>
      )}

      {/* ── Leaderboard ────────────────────────────────── */}
      {!isSearching && (
        <>
          {/* My rank summary */}
          {!loading && myPos > 0 && (
            <div className="rounded-xl border px-4 py-3.5 flex items-center justify-between"
                 style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Ta position</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  #{myPos}
                  <span className="text-[13px] font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>
                    sur {leaderboard.length} joueur{leaderboard.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Points</p>
                <p className="text-2xl font-bold text-[#f6b73c] mt-0.5 tabular-nums">
                  {leaderboard.find((e) => e.isMe)?.rank_points ?? 0}
                </p>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#222] border-t-[#f6b73c]" />
            </div>
          ) : leaderboard.length <= 1 ? (
            /* Empty state — no friends yet */
            <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center"
                 style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                   style={{ background: "var(--bg-border)" }}>
                <Users size={22} strokeWidth={1.6} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>Pas encore d&apos;amis</p>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-faint)" }}>
                  Recherche un joueur pour l&apos;ajouter à ton classement
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Amis · {leaderboard.length} joueur{leaderboard.length !== 1 ? "s" : ""}
              </p>
              {leaderboard.map((entry, i) => (
                <LeaderRow key={entry.id} entry={entry} pos={i + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
