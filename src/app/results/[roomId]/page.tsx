"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";

export default function ResultsPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const router = useRouter();

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400">{error}</p></Shell>;
  if (!room) return null;

  const p1Score = room.player1_score ?? 0;
  const p2Score = room.player2_score ?? 0;
  const isDraw = room.winner === "draw";
  const isP1Win = !isDraw && room.winner === room.player1_id;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-6">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-purple-200 mb-1">Résultats</p>
        <h2 className="text-4xl font-black">
          {isDraw ? "Égalité douteuse" : isP1Win ? "Joueur 1 s'impose !" : "Joueur 2 s'impose !"}
        </h2>
      </header>

      <div className="flex gap-3 mb-6">
        <div className={`flex-1 rounded-3xl p-5 text-center border ${
          isP1Win ? "bg-highlight/20 border-highlight/40" : "bg-white/[0.04] border-white/10"
        }`}>
          <p className="text-xs text-white/50 mb-1">{isHost ? "Toi" : "Joueur 1"}</p>
          <p className="text-5xl font-black">{p1Score}</p>
        </div>
        <div className={`flex-1 rounded-3xl p-5 text-center border ${
          !isDraw && !isP1Win ? "bg-highlight/20 border-highlight/40" : "bg-white/[0.04] border-white/10"
        }`}>
          <p className="text-xs text-white/50 mb-1">{!isHost ? "Toi" : "Joueur 2"}</p>
          <p className="text-5xl font-black">{p2Score}</p>
        </div>
      </div>

      <div className="flex-1" />

      <button
        className="w-full rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
        onClick={() => router.push("/lobby")}
      >
        Rejouer
      </button>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6">
      {children}
    </main>
  );
}

function Spinner() {
  return <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />;
}
