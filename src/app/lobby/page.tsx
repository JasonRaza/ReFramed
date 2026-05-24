"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  leaveRoom,
  startGame,
  startMirrorGame,
  startRankedGame,
  startRoyaleGame,
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
    intro: "Jusqu'à 8 joueurs. Tout le monde joue chaque round — le joueur avec le moins bon score est éliminé. Le dernier debout gagne !",
    start: "Lancer le Battle Royale",
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
      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
      isReady
        ? "bg-surface border-emerald-500/30"
        : "bg-surface border-surface-border",
    ].join(" ")}>
      {isReady ? (
        <Avatar avatar={avatar ?? DEFAULT_AVATAR} size="md" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/15 flex items-center justify-center">
          <div className="h-3 w-3 animate-pulse rounded-full bg-white/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate text-sm ${isReady ? "text-white" : "text-white/40"}`}>
          {isReady ? (username ?? label) : label}
        </p>
        <p className={`text-xs mt-0.5 ${isReady ? "text-emerald-400" : "text-white/25"}`}>
          {isReady ? "Connecté" : "En attente…"}
        </p>
      </div>
      {isReady && <span className="text-emerald-500 text-sm">✓</span>}
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
  // Refs so cleanup callbacks always see the latest values (no stale closures)
  const roomRef = useRef<Room | null>(null);
  const phaseRef = useRef<Phase>("menu");

  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      setAppUrl(origin);
    }
  }, []);

  // ── Cleanup: remove player from lobby on page leave ────────────────────────
  useEffect(() => {
    function cleanup() {
      const r = roomRef.current;
      const p = phaseRef.current;
      // Only act if player is actually in a room (not just on the menu)
      if (!r || p === "menu") return;
      const playerId = getPlayerId();
      void leaveRoom(r.id, playerId);
    }

    function handleBeforeUnload() {
      const r = roomRef.current;
      const p = phaseRef.current;
      if (!r || p === "menu") return;
      const playerId = getPlayerId();
      // sendBeacon is fire-and-forget, survives the page unload
      navigator.sendBeacon(
        "/api/leave-room",
        JSON.stringify({ roomId: r.id, playerId }),
      );
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // SPA navigation (back button, menu button, etc.)
      cleanup();
      if (supabase && channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
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
    } else if (isRoyale) {
      const updated = await startRoyaleGame(room.id);
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-6 animate-fade-up">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 mb-0.5">{copy.eyebrow}</p>
          <h1 className="text-2xl font-bold text-white">ReFramed</h1>
        </div>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-surface border border-surface-border px-3 py-2 text-sm text-white/60 active:bg-surface-hover transition-colors"
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
              className="rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white active:opacity-80 disabled:opacity-40 transition-opacity"
              onClick={handleCreate}
              disabled={busy}
            >
              {busy ? "Création…" : "Créer un salon"}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-surface-border" />
              <span className="text-xs text-white/30">ou rejoindre</span>
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl bg-surface border border-surface-border px-4 py-3 text-center text-2xl font-bold uppercase tracking-[0.25em] placeholder:text-white/15 focus:outline-none focus:border-white/25 transition-colors"
                maxLength={4}
                placeholder="CODE"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <button
                className="rounded-xl bg-surface border border-surface-border px-5 py-3 font-semibold text-sm active:bg-surface-hover disabled:opacity-40 transition-colors"
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
            <div className="text-center space-y-3 w-full">
              <p className="text-xs text-white/40">Code du salon</p>
              <p className="text-7xl font-bold tracking-[0.2em] tabular-nums text-white">{room.code}</p>
              <p className="text-sm text-white/40">
                {isRoyale ? "Partage ce code avec tes joueurs" : "Partage ce code avec ton adversaire"}
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
                className="w-full rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white active:opacity-80 disabled:opacity-40 transition-opacity mt-2"
                onClick={handleStart}
                disabled={!canStart || busy}
              >
                {busy ? "Démarrage…" : copy.start}
              </button>
            </div>
          </div>
        )}

        {/* ── GUEST WAITING ── */}
        {phase === "guest-waiting" && room && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-primary" />
            <div>
              <p className="text-xs text-white/40 mb-1">Salon {room.code}</p>
              <p className="text-xl font-bold text-white">En attente de l&apos;hôte…</p>
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
