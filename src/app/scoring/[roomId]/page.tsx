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

  // Host triggers the scoring API exactly once — waits for both images
  useEffect(() => {
    if (!isHost || !room || calledRef.current) return;
    if (!room.player1_image_url || !room.player2_image_url) return;
    calledRef.current = true;

    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    }).catch(console.error);
    // The API updates room state to RESULTS → Realtime redirects both players
  }, [isHost, room, roomId]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;

  return (
    <Shell>
      {/* Gavel icon in a purple-tinted circle */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/20">
        <svg
          viewBox="0 0 24 24"
          className="h-12 w-12 text-highlight"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2.5 L21.5 9.5 L9.5 21.5 L2.5 14.5 Z" />
          <path d="M9 9 L3 21" />
          <path d="M15 3 L21 9" />
        </svg>
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-black">Les juges délibèrent…</h2>
        <p className="text-sm text-white/50">L&apos;IA analyse vos silhouettes</p>
      </div>

      {/* 4 animated progress dots */}
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
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
  );
}
