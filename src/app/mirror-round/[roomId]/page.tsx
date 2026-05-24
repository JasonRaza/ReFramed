"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useGameRoom } from "@/hooks/useGameRoom";
import { nextMirrorRound } from "@/lib/supabase";
import Avatar, { DEFAULT_AVATAR } from "@/components/Avatar";

export default function MirrorRoundPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [advancing, setAdvancing] = useState(false);
  const [refErr, setRefErr] = useState(false);
  const [copyErr, setCopyErr] = useState(false);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;
  if (!room) return null;

  const r = room as any;
  const currentRound: number = r.current_round ?? 1;
  const totalRounds: number = r.total_rounds ?? 2;

  // Identify who was the poser this round
  const poserSlot = r.current_poser === "player1" ? "player1" : "player2";
  const imitatorSlot = poserSlot === "player1" ? "player2" : "player1";
  const poserName = room[`${poserSlot}_username` as "player1_username"] ?? (poserSlot === "player1" ? "Joueur 1" : "Joueur 2");
  const imitatorName = room[`${imitatorSlot}_username` as "player1_username"] ?? (imitatorSlot === "player1" ? "Joueur 1" : "Joueur 2");
  const imitatorAvatar = room[`${imitatorSlot}_avatar` as "player1_avatar"] ?? DEFAULT_AVATAR;

  // The imitator's score for this round is stored in their player score slot
  const imitatorScore = room[`${imitatorSlot}_score` as "player1_score"] ?? 0;
  const imitatorRoast = room[`${imitatorSlot}_roast` as "player1_roast"] ?? null;

  const isLastRound = currentRound >= totalRounds;

  const handleNext = async () => {
    setAdvancing(true);
    await nextMirrorRound(room);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-5 gap-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
          Round {currentRound} / {totalRounds}
        </p>
        <h2 className="text-2xl font-black">
          {poserName} a posé — {imitatorName} a imité
        </h2>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Reference (poser) */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
            {r.mirror_ref_url && !refErr ? (
              <Image
                src={r.mirror_ref_url as string}
                alt="Pose originale"
                fill
                className="object-cover scale-x-[-1]"
                unoptimized
                onError={() => setRefErr(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
            )}
          </div>
          <div className="p-2 text-center">
            <p className="text-[10px] text-white/40">Pose de {poserName}</p>
          </div>
        </div>

        {/* Imitator attempt */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-purple-400/40 bg-purple-400/5">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
            {r.mirror_copy_url && !copyErr ? (
              <Image
                src={r.mirror_copy_url as string}
                alt="Tentative"
                fill
                className="object-cover scale-x-[-1]"
                unoptimized
                onError={() => setCopyErr(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Avatar avatar={imitatorAvatar} size="lg" />
              </div>
            )}
          </div>
          <div className="space-y-1 p-2 text-center">
            <p className="text-[10px] text-white/40">{imitatorName}</p>
            <p className="text-2xl font-black text-highlight tabular-nums">{imitatorScore}</p>
            {imitatorRoast && (
              <p className="text-[10px] italic leading-tight text-white/40">{imitatorRoast}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {isHost && (
        <button
          className="min-h-[44px] w-full rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-50"
          onClick={handleNext}
          disabled={advancing}
        >
          {advancing ? "…" : isLastRound ? "Voir les résultats" : "Round suivant →"}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-sm text-white/40">
          En attente de l&apos;hôte pour continuer…
        </p>
      )}
    </main>
  );
}

function Shell({ children }: { children?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6">
      {children}
    </main>
  );
}

function Spinner() {
  return <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />;
}
