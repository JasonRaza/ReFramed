"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

const DURATION = 5; // seconds to memorise the pose

export default function PreviewPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [seconds, setSeconds] = useState(DURATION);

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Server-synced countdown: derive remaining time from phase_started_at
  useEffect(() => {
    if (!room?.phase_started_at) return;

    const update = () => {
      const elapsed = (Date.now() - new Date(room.phase_started_at!).getTime()) / 1000;
      const remaining = Math.max(0, DURATION - Math.floor(elapsed));
      setSeconds(remaining);
    };

    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [room?.phase_started_at]);

  // Only the host drives state transitions
  useEffect(() => {
    if (!isHost || seconds > 0) return;
    updateRoomState(roomId, "POSE");
  }, [isHost, seconds, roomId]);

  if (loading) return <FullScreenSpinner />;
  if (error) return <FullScreenError message={error} />;
  if (!pose) return <FullScreenSpinner />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden">
      <div className="relative flex-1">
        <Image
          src={pose.imageUrl}
          alt={pose.title}
          fill
          className="object-cover"
          unoptimized
          priority
        />

        {/* Countdown bubble */}
        <div className="absolute right-4 top-4 rounded-full bg-black/75 px-5 py-3 text-3xl font-black tabular-nums">
          {seconds}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-highlight transition-all duration-500"
            style={{ width: `${(seconds / DURATION) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-200">Mémorise la pose</p>
        <h2 className="text-2xl font-black leading-tight">{pose.title}</h2>
        <p className="text-white/60 text-sm">{pose.artist}</p>
      </div>
    </main>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
    </div>
  );
}

function FullScreenError({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}
