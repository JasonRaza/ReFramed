"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  startGame,
  startMirrorGame,
  startRankedGame,
  subscribeToRoom,
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { getPlayerId, getProfile } from "@/hooks/useGameRoom";
import Avatar, { DEFAULT_AVATAR } from "@/components/Avatar";
import { STATE_ROUTE } from "@/lib/game";
import type { GameMode, GameState, Room, RoyalePlayer } from "@/lib/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Phase = "menu" | "host-waiting" | "guest-waiting";

const MODE_COPY: Record<GameMode, { eyebrow: string; intro: string; start: string }> = {
  duel: {
    eyebrow: "Duel 1v1",
    intro: "Mémorise la pose en 5 secondes, recrée-la en 15. Claude compare et balance un roast impartial.",
    start: "Lancer la partie",
  },
  ranked: {
    eyebrow: "Mode Classé",
    intro: "Même duel, mais avec des points de rang. Gagne proprement, perds avec panache.",
    start: "Lancer le classé",
  },
  mirror: {
    eyebrow: "Mode Miroir",
    intro: "Un joueur invente une pose, l'autre doit la copier. Claude juge la ressemblance.",
    start: "Lancer le miroir",
  },
  royale: {
    eyebrow: "Battle Royale",
    intro: "Jusqu'à 8 joueurs peuvent rejoindre le lobby. MVP: les deux premiers jouent le round, les autres suivent.",
    start: "Lancer le round",
  },
  practice: {
    eyebrow: "Entraînement",
    intro: "Mode solo depuis l'écran d'accueil.",
    start: "Lancer",
  },
};

function roomPath(room: Room): string | null {
  const route = STATE_ROUTE[room.state as GameState];
  return route ? `${route}/${room.id}` : null;
}

function PlayerSlot({
  username,
  avatar,
  label,
  isReady,
}: {
  username: string | null;
  avatar: string | null;
  label: string;
  isReady: boolean;
}) {
  return (
    <div className={[
      "flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-300",
      isReady
        ? "bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]"
        : "bg-surface border-surface-border shadow-glass",
    ].join(" ")}>
      {isReady ? (
        <div className="relative">
          <Avatar avatar={avatar ?? DEFAULT_AVATAR} size="md" />
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0f0f14] text-[10px] text-white">
            ✓
          </div>
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-dashed border-white/20 flex items-center justify-center text-white/20 text-lg">
          <div className="h-4 w-4 animate-pulse rounded-full bg-white/10" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-bold truncate text-base ${isReady ? "text-white" : "text-white/50"}`}>
          {isReady ? (username ?? label) : label}
        </p>
        <p className={`text-xs font-medium mt-0.5 ${isReady ? "text-emerald-400" : "text-white/30"}`}>
          {isReady ? "Prêt pour le duel" : "En attente d'un adversaire…"}
        </p>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyFallback />}>
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "duel") as GameMode;
  const isMirror = mode === "mirror";
  const isRoyale = mode === "royale";
  const copy = MODE_COPY[mode] ?? MODE_COPY.duel;
  const [phase, setPhase] = useState<Phase>("menu");
  const [room, setRoom] = useState<Room | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      setAppUrl(origin);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (supabase && channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Fallback polling for phones where Supabase Realtime is delayed or blocked.
  useEffect(() => {
    if ((phase !== "host-waiting" && phase !== "guest-waiting") || !room?.id) return;
    const id = window.setInterval(async () => {
      const latest = await fetchRoom(room.id);
      if (latest) {
        setRoom(latest);
        if (latest.state !== "LOBBY") {
          const path = roomPath(latest);
          if (path) router.replace(path);
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, room?.id, router]);

  function subscribeAndWatch(roomId: string) {
    if (!supabase) return;
    channelRef.current = subscribeToRoom(roomId, (updated) => {
      setRoom(updated);
      if (updated.state !== "LOBBY") {
        if (supabase && channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        const path = roomPath(updated);
        if (path) router.replace(path);
      }
    });
  }

  async function handleCreate() {
    if (!isSupabaseConfigured) {
      setError("Supabase n'est pas configuré. Ajoute tes clés dans .env.local.");
      return;
    }
    setBusy(true);
    setError("");
    const playerId = getPlayerId();
    const profile = getProfile();
    const result = await createRoom(playerId, profile, mode);
    if (!result) {
      setError("Impossible de créer le salon. Vérifie ta connexion.");
      setBusy(false);
      return;
    }
    localStorage.setItem("reframed_room_id", result.room.id);
    setRoom(result.room);
    setPhase("host-waiting");
    setBusy(false);
    subscribeAndWatch(result.room.id);
  }

  async function handleJoin() {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 4) {
      setError("Le code fait 4 lettres.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    setBusy(true);
    setError("");
    const playerId = getPlayerId();
    const profile = getProfile();
    const joined = await joinRoom(code, playerId, profile);
    if (!joined) {
      setError("Salon introuvable. Vérifie le code.");
      setBusy(false);
      return;
    }
    localStorage.setItem("reframed_room_id", joined.id);
    setRoom(joined);
    if (joined.state !== "LOBBY") {
      const path = roomPath(joined);
      if (path) router.replace(path);
      return;
    }
    setPhase("guest-waiting");
    setBusy(false);
    subscribeAndWatch(joined.id);
  }

  async function handleStart() {
    if (!room || !isSupabaseConfigured) return;
    setBusy(true);
    if (isMirror) {
      const updated = await startMirrorGame(room.id);
      if (!updated) {
        setError("Impossible de démarrer. Réessaie.");
        setBusy(false);
        return;
      }
      const path = roomPath(updated);
      router.replace(path ?? `/mirror-pose/${room.id}`);
    } else if (mode === "ranked") {
      const updated = await startRankedGame(room.id);
      if (!updated) {
        setError("Impossible de démarrer. Réessaie.");
        setBusy(false);
        return;
      }
      const path = roomPath(updated);
      router.replace(path ?? `/preview/${room.id}`);
    } else {
      const updated = await startGame(room.id);
      if (!updated) {
        setError("Impossible de démarrer. Réessaie.");
        setBusy(false);
        return;
      }
      const path = roomPath(updated);
      router.replace(path ?? `/preview/${room.id}`);
    }
  }

  const player2Here = Boolean(room?.player2_id);
  const royalePlayers = Array.isArray(room?.royale_players)
    ? room.royale_players
    : room
      ? [
          {
            id: room.player1_id ?? "player1",
            username: room.player1_username,
            avatar: room.player1_avatar,
            joinedAt: room.created_at,
          },
          ...(room.player2_id
            ? [{
                id: room.player2_id,
                username: room.player2_username,
                avatar: room.player2_avatar,
                joinedAt: room.created_at,
              }]
            : []),
        ]
      : [];
  const canStart = isRoyale ? royalePlayers.length >= 2 : player2Here;

  // ─── RENDER ────────────────────────────────────────────────────────────────

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 gap-4 text-center">
        <h1 className="text-4xl font-black">ReFramed</h1>
        <div className="rounded-2xl bg-yellow-500/20 border border-yellow-500/30 p-5 text-sm text-yellow-200">
          <p className="font-bold mb-1">Supabase non configuré</p>
          <p>Copie <code>.env.example</code> en <code>.env.local</code> et remplis tes clés Supabase.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-6 animate-fade-up">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {copy.eyebrow}
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">ReFramed</h1>
        </div>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-surface border border-surface-border shadow-glass px-3 py-2 text-sm font-medium text-white/70 active:scale-95 hover:bg-surface-hover hover:text-white transition-all"
        >
          ← Menu
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <>
            <p className="text-sm text-white/60 font-medium leading-relaxed mb-2">
              {copy.intro}
            </p>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400 backdrop-blur-md">
                {error}
              </p>
            )}

            <button
              className="group relative overflow-hidden rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-50 transition-all"
              onClick={handleCreate}
              disabled={busy}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {busy ? "Création…" : "Créer un salon"}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">ou rejoindre</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl bg-surface border border-surface-border shadow-glass px-4 py-3 text-center text-2xl font-black uppercase tracking-[0.3em] placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-surface-hover transition-all"
                maxLength={4}
                placeholder="CODE"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <button
                className="rounded-2xl bg-surface border border-surface-border shadow-glass px-6 py-3 font-bold active:scale-[0.98] disabled:opacity-40 hover:bg-surface-hover hover:border-white/20 transition-all"
                onClick={handleJoin}
                disabled={busy || joinInput.length !== 4}
              >
                {busy ? "…" : "Entrer"}
              </button>
            </div>

            {appUrl && (
              <div className="flex flex-col items-center gap-3 pt-6 mt-auto">
                <div className="rounded-3xl bg-white p-4 shadow-xl">
                  <QRCodeSVG value={appUrl} size={140} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Scanne pour rejoindre</p>
              </div>
            )}
          </>
        )}

        {/* ── HOST WAITING ── */}
        {phase === "host-waiting" && room && (
          <div className="flex flex-1 flex-col items-center justify-between py-2">
            <div className="text-center space-y-4 w-full">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 backdrop-blur-md shadow-glass">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Code du salon</p>
              </div>
              <div className="relative py-4">
                <p className="text-7xl font-black tracking-[0.2em] tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-lg">{room.code}</p>
                <div className="absolute inset-0 -z-10 blur-[40px] bg-primary/20 rounded-full" />
              </div>
              <p className="text-white/50 text-sm font-medium">
                {isRoyale ? "Partage ce code avec tous les joueurs" : "Partage ce code avec ton adversaire"}
              </p>
            </div>

            <div className="w-full space-y-3 mt-8">
              {isRoyale ? (
                <RoyaleRoster players={royalePlayers} maxPlayers={room.max_players ?? 8} />
              ) : (
                <>
                  <PlayerSlot
                    username={room.player1_username}
                    avatar={room.player1_avatar}
                    label="Joueur 1 (toi)"
                    isReady
                  />
                  <PlayerSlot
                    username={room.player2_username}
                    avatar={room.player2_avatar}
                    label="Joueur 2"
                    isReady={player2Here}
                  />
                </>
              )}

              {error && (
                <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400 text-center backdrop-blur-md">
                  {error}
                </p>
              )}

              <button
                className="group relative overflow-hidden w-full rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-40 transition-all mt-4"
                onClick={handleStart}
                disabled={!canStart || busy}
              >
                {!(!canStart || busy) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                {busy ? "Démarrage…" : copy.start}
              </button>
            </div>
          </div>
        )}

        {/* ── GUEST WAITING ── */}
        {phase === "guest-waiting" && room && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-surface-border border-t-primary relative z-10" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Salon {room.code}</p>
              <p className="text-2xl font-black tracking-tight text-white">En attente de l&apos;hôte…</p>
            </div>
            <div className="w-full space-y-3 mt-4">
              {room.mode === "royale" ? (
                <RoyaleRoster players={royalePlayers} maxPlayers={room.max_players ?? 8} />
              ) : (
                <>
                  <PlayerSlot
                    username={room.player1_username}
                    avatar={room.player1_avatar}
                    label="Hôte"
                    isReady
                  />
                  <PlayerSlot
                    username={room.player2_username}
                    avatar={room.player2_avatar}
                    label="Toi"
                    isReady
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function RoyaleRoster({
  players,
  maxPlayers,
}: {
  players: RoyalePlayer[];
  maxPlayers: number;
}) {
  const slots = Array.from({ length: maxPlayers }, (_, index) => players[index] ?? null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        <span>Joueurs connectés</span>
        <span className="bg-white/10 px-2 py-0.5 rounded-full text-white/70">{players.length}/{maxPlayers}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {slots.map((player, index) => (
          <div
            key={player?.id ?? index}
            className={[
              "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300",
              player 
                ? "border-emerald-500/30 bg-emerald-500/10 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]" 
                : "border-surface-border bg-surface shadow-glass",
            ].join(" ")}
          >
            {player ? (
              <Avatar avatar={player.avatar ?? DEFAULT_AVATAR} size="sm" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02] text-xs text-white/20">
                {index + 1}
              </div>
            )}
            <span className={`min-w-0 flex-1 truncate text-sm font-bold ${player ? "text-white/90" : "text-white/30"}`}>
              {player?.username ?? "Libre"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LobbyFallback() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
    </main>
  );
}
