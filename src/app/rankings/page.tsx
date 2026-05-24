"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, Check, Users, Globe, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { useLocale } from "@/hooks/useLocale";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaderEntry = {
  id:           string;
  username:     string;
  avatar:       string;
  rank_points:  number;
  games_played: number;
  wins:         number;
  best_score:   number;
  isMe:         boolean;
  isFriend:     boolean;
};

type SearchEntry = {
  id:          string;
  username:    string;
  avatar:      string;
  rank_points: number;
  isFriend:    boolean;
  isMe:        boolean;
};

type Tab = "global" | "friends";

// ── Medal / position badge ────────────────────────────────────────────────────

function PosBadge({ pos, isMe }: { pos: number; isMe: boolean }) {
  if (pos === 1) return <span className="text-lg leading-none">🥇</span>;
  if (pos === 2) return <span className="text-lg leading-none">🥈</span>;
  if (pos === 3) return <span className="text-lg leading-none">🥉</span>;
  return (
    <span className="text-[12px] font-bold tabular-nums w-5 text-center" style={{ color: isMe ? "#f6b73c" : "var(--text-muted)" }}>
      {pos}
    </span>
  );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────

function LeaderRow({
  entry,
  pos,
  onAdd,
  onRemove,
  actionLoading,
  showFriendBtn,
  t,
}: {
  entry: LeaderEntry;
  pos: number;
  onAdd?: (id: string) => void;
  onRemove?: (id: string) => void;
  actionLoading: boolean;
  showFriendBtn: boolean;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const label = rankLabel(entry.rank_points);
  const color = RANK_COLORS[label] ?? "#f6b73c";
  const winRate = entry.games_played > 0
    ? Math.round((entry.wins / entry.games_played) * 100)
    : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
        entry.isMe
          ? "border border-[#f6b73c]/25 bg-[#f6b73c]/6"
          : "bg-[#1a1a1a] border border-[#222]",
      )}
      style={!entry.isMe ? { background: "var(--bg-surface)", borderColor: "var(--bg-border)" } : undefined}
    >
      <div className="flex items-center justify-center w-6 flex-shrink-0">
        <PosBadge pos={pos} isMe={entry.isMe} />
      </div>

      <Avatar avatar={entry.avatar} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("text-[13px] font-semibold truncate", entry.isMe ? "text-[#f6b73c]" : "text-white")}>
            {entry.username}
          </p>
          {entry.isMe && (
            <span className="text-[10px] font-medium text-[#f6b73c]/60 flex-shrink-0">({t.youLabel})</span>
          )}
          {entry.isFriend && !entry.isMe && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#818cf8]/15 text-[#818cf8] flex-shrink-0">
              {t.friendLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] font-semibold" style={{ color }}>{label}</p>
          {entry.games_played > 0 && (
            <>
              <span className="text-[10px] text-[#333]">·</span>
              <p className="text-[10px] text-[#555]">{entry.games_played} {t.gamesLabel}</p>
              <span className="text-[10px] text-[#333]">·</span>
              <p className="text-[10px] text-[#555]">{winRate}% {t.winsLabel}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-[13px] font-bold tabular-nums text-white">
          {entry.rank_points}
          <span className="text-[10px] font-normal text-[#555] ml-0.5">pts</span>
        </p>

        {showFriendBtn && !entry.isMe && onAdd && onRemove && (
          entry.isFriend ? (
            <button
              onClick={() => onRemove(entry.id)}
              disabled={actionLoading}
              className="flex items-center gap-1 rounded-lg bg-[#222] border border-[#2a2a2a] px-2 py-1 text-[10px] font-medium text-[#555] transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
            >
              <Check size={11} strokeWidth={2.5} />
              {t.friendLabel}
            </button>
          ) : (
            <button
              onClick={() => onAdd(entry.id)}
              disabled={actionLoading}
              className="flex items-center gap-1 rounded-lg bg-[#f6b73c]/10 border border-[#f6b73c]/25 px-2 py-1 text-[10px] font-medium text-[#f6b73c] transition-colors hover:bg-[#f6b73c]/20 disabled:opacity-40"
            >
              <UserPlus size={11} strokeWidth={2.5} />
              {t.addLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Search result row ─────────────────────────────────────────────────────────

function SearchRow({
  entry,
  onAdd,
  onRemove,
  loading,
  t,
}: {
  entry:    SearchEntry;
  onAdd:    (id: string) => void;
  onRemove: (id: string) => void;
  loading:  boolean;
  t: ReturnType<typeof useLocale>["t"];
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
            <Check size={12} strokeWidth={2.5} /> {t.friendLabel}
          </button>
        ) : (
          <button
            onClick={() => onAdd(entry.id)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#f6b73c]/10 border border-[#f6b73c]/25 px-3 py-1.5 text-[11px] font-medium text-[#f6b73c] transition-colors hover:bg-[#f6b73c]/20 disabled:opacity-40"
          >
            <UserPlus size={12} strokeWidth={2.5} /> {t.addLabel}
          </button>
        )
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const { t } = useLocale();
  const [myId,          setMyId]          = useState<string | null>(null);
  const [tab,           setTab]           = useState<Tab>("global");
  const [globalBoard,   setGlobalBoard]   = useState<LeaderEntry[]>([]);
  const [friendsBoard,  setFriendsBoard]  = useState<LeaderEntry[]>([]);
  const [friendIds,     setFriendIds]     = useState<Set<string>>(new Set());
  const [query,         setQuery]         = useState("");
  const [results,       setResults]       = useState<SearchEntry[]>([]);
  const [searching,     setSearching]     = useState(false);
  const [actionId,      setActionId]      = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    async function init() {
      const user = await getAuthUser();
      if (!user) { setLoading(false); return; }
      setMyId(user.id);

      // rank_points are written to DB immediately via userStore — no manual sync needed
      await Promise.all([loadGlobal(user.id), loadFriends(user.id)]);
      setLoading(false);
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGlobal(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("user_profiles")
      .select("id, username, avatar, rank_points, games_played, wins, best_score")
      .order("rank_points", { ascending: false })
      .limit(50);
    if (!data) return;
    setGlobalBoard((data as any[]).map((p) => ({
      ...p,
      games_played: p.games_played ?? 0,
      wins:         p.wins ?? 0,
      best_score:   p.best_score ?? 0,
      isMe:     p.id === userId,
      isFriend: false,
    })));
  }

  async function loadFriends(userId: string) {
    if (!supabase) return;
    const { data: fData } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);
    const ids = new Set<string>((fData ?? []).map((r: { friend_id: string }) => r.friend_id));
    setFriendIds(ids);

    const allIds = [userId, ...Array.from(ids)];
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, username, avatar, rank_points, games_played, wins, best_score")
      .in("id", allIds);
    if (!profiles) return;

    const entries: LeaderEntry[] = (profiles as any[])
      .map((p) => ({
        ...p,
        games_played: p.games_played ?? 0,
        wins:         p.wins ?? 0,
        best_score:   p.best_score ?? 0,
        isMe:     p.id === userId,
        isFriend: ids.has(p.id),
      }))
      .sort((a, b) => b.rank_points - a.rank_points);

    setFriendsBoard(entries);
    setGlobalBoard((prev) => prev.map((e) => ({ ...e, isFriend: ids.has(e.id) })));
  }

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearching(true);

    searchTimeout.current = setTimeout(async () => {
      if (!supabase || !myId) { setSearching(false); return; }
      const { data } = await supabase.rpc("find_profile_by_email", { search_email: query.trim() });
      setResults(
        (data ?? []).map((p: { id: string; username: string; avatar: string; rank_points: number }) => ({
          ...p,
          isFriend: friendIds.has(p.id),
          isMe: p.id === myId,
        }))
      );
      setSearching(false);
    }, 350);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, myId, friendIds]);

  async function handleAdd(friendId: string) {
    if (!supabase || !myId) return;
    setActionId(friendId);
    await supabase.from("friendships").insert({ user_id: myId, friend_id: friendId });
    const next = new Set(friendIds); next.add(friendId); setFriendIds(next);
    await loadFriends(myId);
    setActionId(null);
  }

  async function handleRemove(friendId: string) {
    if (!supabase || !myId) return;
    setActionId(friendId);
    await supabase.from("friendships").delete().eq("user_id", myId).eq("friend_id", friendId);
    const next = new Set(friendIds); next.delete(friendId); setFriendIds(next);
    setFriendsBoard((prev) => prev.filter((e) => e.id !== friendId || e.isMe));
    setGlobalBoard((prev) => prev.map((e) => e.id === friendId ? { ...e, isFriend: false } : e));
    setActionId(null);
  }

  const isSearching = query.trim().length > 0;
  const activeBoard = tab === "global" ? globalBoard : friendsBoard;
  const myPos       = activeBoard.findIndex((e) => e.isMe) + 1;

  const playerCount = (n: number) => `${n} ${n === 1 ? t.playerSingular : t.playerPlural}`;
  const resultCount = (n: number) => `${n} ${n === 1 ? t.resultSingular : t.resultPlural}`;

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{t.rankings}</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t.rankPoints}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
        {(["global", "friends"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-semibold transition-colors",
              tab === tabKey ? "bg-[#f6b73c] text-black shadow-sm" : "",
            )}
            style={tab !== tabKey ? { color: "var(--text-muted)" } : undefined}
            onMouseEnter={(e) => { if (tab !== tabKey) e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { if (tab !== tabKey) e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {tabKey === "global" ? <Globe size={13} strokeWidth={2} /> : <Users size={13} strokeWidth={2} />}
            {tabKey === "global" ? t.globalTab : t.friendsTab}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3.5" strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
        <input
          type="email"
          placeholder={t.searchPlaceholder}
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

      {/* Search results */}
      {isSearching && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            {searching
              ? t.searchingLabel
              : results.length === 0
              ? t.noResults
              : resultCount(results.length)}
          </p>
          {!searching && results.length === 0 && (
            <p className="text-center text-[13px] py-6" style={{ color: "var(--text-faint)" }}>{t.noPlayersFound}</p>
          )}
          {results.map((r) => (
            <SearchRow
              key={r.id}
              entry={{ ...r, isFriend: friendIds.has(r.id) }}
              onAdd={handleAdd}
              onRemove={handleRemove}
              loading={actionId === r.id}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {!isSearching && (
        <>
          {!loading && myPos > 0 && (
            <div
              className="rounded-xl border px-4 py-3.5 flex items-center justify-between"
              style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {t.yourPosition} · {tab === "global" ? t.globalTab : t.friendsTab}
                </p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                  #{myPos}
                  <span className="text-[13px] font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>
                    {t.ofLabel} {playerCount(activeBoard.length)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t.pointsLabel}</p>
                <p className="text-2xl font-bold text-[#f6b73c] mt-0.5 tabular-nums">
                  {activeBoard.find((e) => e.isMe)?.rank_points ?? 0}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#222] border-t-[#f6b73c]" />
            </div>
          ) : tab === "friends" && friendsBoard.length <= 1 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center"
              style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--bg-border)" }}>
                <Users size={22} strokeWidth={1.6} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{t.noFriendsTitle}</p>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-faint)" }}>{t.noFriendsDesc}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {tab === "global"
                  ? `${t.topLabel} ${activeBoard.length}`
                  : `${t.friendsTab} · ${playerCount(activeBoard.length)}`}
              </p>
              {activeBoard.map((entry, i) => (
                <LeaderRow
                  key={entry.id}
                  entry={entry}
                  pos={i + 1}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  actionLoading={actionId === entry.id}
                  showFriendBtn={tab === "global"}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
