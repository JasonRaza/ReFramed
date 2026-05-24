"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { playDrumroll, stopDrumroll } from "@/lib/sounds";

export default function MirrorScoringPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const calledRef = useRef(false);
  const [dotStep, setDotStep] = useState(0);

  useEffect(() => {
    void playDrumroll(2500);
    return () => stopDrumroll();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setDotStep((s: number) => (s + 1) % 5), 400);
    return () => clearInterval(id);
  }, []);

  // Host triggers the mirror scoring API exactly once
  useEffect(() => {
    if (!isHost || !room || calledRef.current) return;
    const r = room as any;
    if (!r.mirror_ref_url || !r.mirror_copy_url) return;
    calledRef.current = true;

    fetch("/api/score-mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(console.error);
    // API updates room state to MIRROR_ROUND or RESULTS → Realtime redirects both players
  }, [isHost, room, roomId]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;

  return (
    <Shell>
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
        <span className="text-5xl">🪞</span>
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black">Analyse en cours…</h2>
        <p className="text-sm text-white/50">L&apos;IA compare les silhouettes</p>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full transition-all duration-300"
            style={{
              background: dotStep > i ? "#a855f7" : "rgba(255,255,255,0.15)",
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
  return <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />;
}
