"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  createRoom,
  fetchRoom,
  joinRoom,
  startGame,
  subscribeToRoom,
  supabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { getPlayerId } from "@/hooks/useGameRoom";
import type { Room } from "@/lib/game";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Phase = "menu" | "host-waiting" | "guest-waiting";

export default function LobbyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("menu");
  const [room, setRoom] = useState<Room | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // QR code URL — only meaningful on production (Vercel)
  useEffect(() => {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      setAppUrl(origin);
    }
  }, []);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (supabase && channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Poll every 3 s as a fallback when realtime isn't configured
  useEffect(() => {
    if (phase !== "host-waiting" || !room?.id) return;
    const id = window.setInterval(async () => {
      const latest = await fetchRoom(room.id);
      if (latest) {
        setRoom(latest);
        if (latest.state === "PREVIEW") router.push(`/preview/${room.id}`);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [phase, room?.id, router]);

  function subscribeAndWatch(roomId: string) {
    if (!supabase) return;
    channelRef.current = subscribeToRoom(roomId, (updated) => {
      setRoom(updated);
      if (updated.state === "PREVIEW") {
        supabase!.removeChannel(channelRef.current!);
        router.push(`/preview/${roomId}`);
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
    const result = await createRoom(playerId);
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
    const joined = await joinRoom(code, playerId);
    if (!joined) {
      setError("Salon introuvable. Vérifie le code.");
      setBusy(false);
      return;
    }
    localStorage.setItem("reframed_room_id", joined.id);
    setRoom(joined);
    // If the game already started (late join), go to the active page
    if (joined.state !== "LOBBY") {
      router.push(`/${joined.state.toLowerCase()}/${joined.id}`);
      return;
    }
    setPhase("guest-waiting");
    setBusy(false);
    subscribeAndWatch(joined.id);
  }

  async function handleStart() {
    if (!room || !isSupabaseConfigured) return;
    setBusy(true);
    const updated = await startGame(room.id);
    if (!updated) {
      setError("Impossible de démarrer. Réessaie.");
      setBusy(false);
      return;
    }
    router.push(`/preview/${room.id}`);
  }

  const player2Here = Boolean(room?.player2_id);

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-6">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-purple-200">Duel 1v1</p>
        <h1 className="text-5xl font-black tracking-tight">ReFramed</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4">
        {/* ── MENU ── */}
        {phase === "menu" && (
          <>
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 text-sm text-white/70 leading-relaxed">
              Mémorise la pose en 5 secondes, recrée-la en 15.
              Claude compare et balance un roast impartial.
            </div>

            {error && (
              <p className="rounded-2xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              className="rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-50"
              onClick={handleCreate}
              disabled={busy}
            >
              {busy ? "Création…" : "Créer un salon"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 text-center text-xl font-bold uppercase tracking-widest placeholder:text-white/30 focus:outline-none focus:border-primary"
                maxLength={4}
                placeholder="CODE"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <button
                className="rounded-2xl bg-white/[0.08] border border-white/10 px-5 py-3 font-bold active:scale-[0.98] disabled:opacity-50"
                onClick={handleJoin}
                disabled={busy || joinInput.length !== 4}
              >
                {busy ? "…" : "Rejoindre"}
              </button>
            </div>

            {/* QR code — only shown on production */}
            {appUrl && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <div className="rounded-2xl bg-white p-3">
                  <QRCodeSVG value={appUrl} size={120} />
                </div>
                <p className="text-xs text-white/30">Scanne pour rejoindre depuis un autre téléphone</p>
              </div>
            )}
          </>
        )}

        {/* ── HOST WAITING ── */}
        {phase === "host-waiting" && room && (
          <div className="flex flex-1 flex-col items-center justify-between py-6">
            <div className="text-center space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-purple-200">Code du salon</p>
              <p className="text-7xl font-black tracking-[0.15em]">{room.code}</p>
              <p className="text-white/50 text-sm">Donne ce code à ton adversaire</p>
            </div>

            <div className="w-full space-y-4">
              <div className={`rounded-2xl border px-5 py-4 text-center text-sm font-medium transition-colors ${
                player2Here
                  ? "bg-green-500/15 border-green-500/30 text-green-300"
                  : "bg-white/[0.04] border-white/10 text-white/50"
              }`}>
                {player2Here ? "✓ Joueur 2 rejoint — prêt à démarrer !" : "En attente du joueur 2…"}
              </div>

              {error && (
                <p className="rounded-2xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300 text-center">
                  {error}
                </p>
              )}

              <button
                className="w-full rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-40"
                onClick={handleStart}
                disabled={!player2Here || busy}
              >
                {busy ? "Démarrage…" : "Lancer la partie"}
              </button>
            </div>
          </div>
        )}

        {/* ── GUEST WAITING ── */}
        {phase === "guest-waiting" && room && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
            <div>
              <p className="text-2xl font-black">Salon {room.code}</p>
              <p className="text-white/50 mt-1">En attente que l&apos;hôte démarre…</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
