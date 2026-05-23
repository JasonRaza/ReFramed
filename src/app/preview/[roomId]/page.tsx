"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

const DURATION = 5;

export default function PreviewPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [seconds, setSeconds] = useState(DURATION);

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Server-synced countdown
  useEffect(() => {
    if (!room?.phase_started_at) return;
    const tick = () => {
      const elapsed = (Date.now() - new Date(room.phase_started_at!).getTime()) / 1000;
      setSeconds(Math.max(0, DURATION - Math.floor(elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room?.phase_started_at]);

  // Only the host drives PREVIEW → POSE
  useEffect(() => {
    if (!isHost || seconds > 0) return;
    void updateRoomState(roomId, "POSE");
  }, [isHost, seconds, roomId]);

  if (loading || !pose) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const progress = seconds / DURATION;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-black">
      {/* Full-screen reference image */}
      <div className="relative flex-1">
        <Image
          src={pose.imageUrl}
          alt={pose.title}
          fill
          className="object-cover"
          unoptimized
          priority
        />

        {/* Countdown bubble — top right */}
        <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 shadow-glow">
          <span className="text-2xl font-black tabular-nums">{seconds}</span>
        </div>

        {/* Bottom gradient with pose info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-8 pt-20">
          <div className="px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300">
              Mémorise la pose
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight">{pose.title}</h2>
            <p className="mt-1 text-sm text-white/50">{pose.artist}</p>
          </div>
        </div>
      </div>

      {/* Depleting progress bar at very bottom */}
      <div className="h-1 w-full bg-white/10">
        <div
          className="h-full bg-highlight transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </main>
  );
}
