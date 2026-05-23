"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

function useCountUp(target: number, delay = 0): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const t0 = performance.now() + delay;
    let raf: number;
    function tick(now: number) {
      const elapsed = Math.max(0, now - t0);
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return val;
}

function PlayerCard({
  label,
  imageUrl,
  score,
  roast,
  isWinner,
  delay,
}: {
  label: string;
  imageUrl: string | null;
  score: number;
  roast: string | null;
  isWinner: boolean;
  delay: number;
}) {
  const displayed = useCountUp(score, delay);
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${
        isWinner
          ? "border-yellow-400/60 bg-yellow-400/10 scale-[1.02]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {isWinner && (
        <div className="py-1 text-center text-sm">👑</div>
      )}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        {imageUrl ? (
          <Image src={imageUrl} alt={label} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20 text-xs">
            —
          </div>
        )}
      </div>
      <div className="p-3 text-center space-y-1">
        <p className="text-xs text-white/40">{label}</p>
        <p className={`text-3xl font-black tabular-nums ${isWinner ? "text-yellow-400" : ""}`}>
          {displayed}
        </p>
        {roast && (
          <p className="text-[11px] italic text-white/40 leading-tight">{roast}</p>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const router = useRouter();

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Confetti burst on mount
  useEffect(() => {
    const t = setTimeout(() => {
      void import("canvas-confetti").then(({ default: fire }) => {
        fire({ particleCount: 160, spread: 80, origin: { y: 0.55 } });
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;
  if (!room) return null;

  const p1Score = room.player1_score ?? 0;
  const p2Score = room.player2_score ?? 0;
  const isDraw = room.winner === "tie" || room.winner === "draw";
  const p1Wins = !isDraw && room.winner === "player1";
  const p2Wins = !isDraw && room.winner === "player2";

  const winnerLabel = isDraw
    ? "Égalité douteuse"
    : p1Wins
      ? (isHost ? "Tu gagnes !" : "Joueur 1 gagne !")
      : (isHost ? "Tu perds…" : "Joueur 2 gagne !");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-5 gap-4">
      {/* Winner badge */}
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Résultats</p>
        <h2 className="text-3xl font-black">{winnerLabel}</h2>
      </div>

      {/* 3 images: reference | p1 | p2 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Reference */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
            {pose && (
              <Image
                src={pose.imageUrl}
                alt={pose.title}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <div className="p-2 text-center">
            <p className="text-[10px] text-white/40 leading-tight">Référence</p>
          </div>
        </div>

        <PlayerCard
          label={isHost ? "Toi" : "Joueur 1"}
          imageUrl={room.player1_image_url}
          score={p1Score}
          roast={room.player1_roast}
          isWinner={p1Wins}
          delay={300}
        />

        <PlayerCard
          label={!isHost ? "Toi" : "Joueur 2"}
          imageUrl={room.player2_image_url}
          score={p2Score}
          roast={room.player2_roast}
          isWinner={p2Wins}
          delay={600}
        />
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
    <main className="flex min-h-dvh items-center justify-center">{children}</main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
  );
}
