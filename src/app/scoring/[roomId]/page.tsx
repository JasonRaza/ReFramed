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
      <div className="text-5xl">⚖️</div>

      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-white">Délibération…</h2>
        <p className="text-sm text-white/40">Claude analyse les poses</p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full transition-all duration-300"
            style={{
              background: dotStep > i ? "#7c3aed" : "rgba(255,255,255,0.15)",
              transform: dotStep === i ? "scale(1.4)" : "scale(1)",
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
