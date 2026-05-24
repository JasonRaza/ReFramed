"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { playDrumroll, stopDrumroll } from "@/lib/sounds";

export default function ScoringPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const calledRef = useRef(false);
  const [dotStep, setDotStep] = useState(0);

  // Drumroll on mount — stops automatically or when unmounting
  useEffect(() => {
    void playDrumroll(2500);
    return () => stopDrumroll();
  }, []);

  // Animate the 4 dots
  useEffect(() => {
    const id = setInterval(() => setDotStep((s: number) => (s + 1) % 5), 400);
    return () => clearInterval(id);
  }, []);

  // Host triggers the scoring API exactly once — waits for all images
  useEffect(() => {
    if (!isHost || !room || calledRef.current) return;

    const isRoyale = room.mode === "royale";

    if (isRoyale) {
      // For royale: wait until all active players have uploaded
      const activePlayers = (room.royale_players ?? []).filter((p) => !p.eliminated);
      const imgs = (room.royale_player_images ?? {}) as Record<string, string>;
      if (activePlayers.length === 0 || !activePlayers.every((p) => imgs[p.id])) return;
    } else {
      if (!room.player1_image_url || !room.player2_image_url) return;
    }

    calledRef.current = true;

    fetch(isRoyale ? "/api/score-royale" : "/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(console.error);
    // The API updates room state to RESULTS → Realtime redirects all players
  }, [isHost, room, roomId]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;

  return (
    <Shell>
      {/* Pulsing judge icon */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
        <div className="absolute inset-2 rounded-full bg-primary/15 animate-pulse-slow" />
        <div className="relative flex h-full w-full items-center justify-center rounded-full border border-primary/40 bg-primary/25 text-5xl">
          ⚖️
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black tracking-tight">Délibération…</h2>
        <p className="text-sm text-white/40">Claude analyse vos silhouettes</p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full transition-all duration-300"
            style={{
              background: dotStep > i ? "#a855f7" : "rgba(255,255,255,0.12)",
              transform: dotStep === i ? "scale(1.5)" : "scale(1)",
              boxShadow: dotStep > i ? "0 0 8px rgba(168,85,247,0.6)" : "none",
            }}
          />
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
      {children}
    </main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
  );
}
