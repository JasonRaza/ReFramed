"use client";

import { useEffect, useRef } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";

export default function ScoringPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const calledRef = useRef(false);

  // Host triggers the scoring API exactly once
  useEffect(() => {
    if (!isHost || !room || calledRef.current) return;
    if (!room.player1_image_url || !room.player2_image_url) return;
    calledRef.current = true;

    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(console.error);
    // The API call updates room state to RESULTS → Realtime redirects both players
  }, [isHost, room, roomId]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;

  return (
    <Shell>
      {/* Gavel icon in a purple circle */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
        <span className="text-5xl">⚖️</span>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black">Les juges délibèrent…</h2>
        <p className="text-white/50">L&apos;IA analyse vos silhouettes</p>
      </div>

      {/* 4 animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-highlight"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
