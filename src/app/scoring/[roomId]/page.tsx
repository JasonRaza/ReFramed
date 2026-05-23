"use client";

import { use, useEffect, useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import poses from "@/lib/poses.json";
import type { Pose, ScoreResult } from "@/lib/game";

const roastFallbacks = [
  "On dirait une statue qui a raté son bus.",
  "Le Louvre appelle, il veut récupérer son brouillon.",
  "Beau chaos corporel. Presque de l'art.",
  "La pose est là. La dignité, beaucoup moins.",
];

export default function ScoringPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [status, setStatus] = useState("Claude juge…");

  useEffect(() => {
    if (!isHost || !room?.current_pose_id) return;

    const playerPhoto = localStorage.getItem("reframed_photo");

    async function score() {
      const pose = (poses as Pose[]).find((p) => p.id === room!.current_pose_id);
      if (!pose) return;

      const fallback: ScoreResult = {
        playerScore: Math.floor(Math.random() * 30) + 60,
        opponentScore: Math.floor(Math.random() * 30) + 60,
        winner: "draw",
        roast: roastFallbacks[Math.floor(Math.random() * roastFallbacks.length)],
      };

      let result = fallback;

      try {
        setStatus("Envoi des photos à Claude…");
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            poseId: pose.id,
            // Real integration: use actual player photo base64 strings here
            playerImageBase64: playerPhoto?.replace(/^data:image\/[a-z]+;base64,/, "") ?? "",
            opponentImageBase64: playerPhoto?.replace(/^data:image\/[a-z]+;base64,/, "") ?? "",
          }),
        });
        if (res.ok) result = (await res.json()) as ScoreResult;
      } catch {
        // fall through to fallback
      }

      // Determine winner string
      const winnerField =
        result.winner === "draw"
          ? "draw"
          : result.winner === "player"
            ? room!.player1_id ?? "player1"
            : room!.player2_id ?? "player2";

      await updateRoomState(roomId, "RESULTS", {
        player1_score: result.playerScore,
        player2_score: result.opponentScore,
        winner: winnerField,
      });
    }

    void score();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, room?.current_pose_id]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400">{error}</p></Shell>;

  return (
    <Shell>
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
      <h2 className="text-3xl font-black">{status}</h2>
      <p className="text-white/60 text-sm">Aucun ego n&apos;est couvert par l&apos;assurance.</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      {children}
    </main>
  );
}

function Spinner() {
  return <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />;
}
