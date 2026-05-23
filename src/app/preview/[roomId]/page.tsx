"use client";

import { useEffect, useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";
import PoseCard from "@/components/PoseCard";
import CountdownTimer from "@/components/CountdownTimer";

const DURATION = 5;

export default function PreviewPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [seconds, setSeconds] = useState(DURATION);

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Server-synced countdown derived from preview_started_at
  useEffect(() => {
    if (!room?.preview_started_at) return;
    const tick = () => {
      const elapsed = (Date.now() - new Date(room.preview_started_at!).getTime()) / 1000;
      setSeconds(Math.max(0, DURATION - Math.floor(elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room?.preview_started_at]);

  // Only the host drives PREVIEW → POSE
  useEffect(() => {
    if (!isHost || seconds > 0) return;
    void updateRoomState(roomId, "POSE");
  }, [isHost, seconds, roomId]);

  if (loading || !pose) return <FullScreenSpinner />;
  if (error) return <FullScreenError message={error} />;

  const progress = seconds / DURATION;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-black">
      {/* Full-screen pose image with gradient overlay */}
      <PoseCard pose={pose} size="full" />

      {/* Countdown bubble — top right, purple circle */}
      <div className="absolute right-4 top-4 z-10">
        <CountdownTimer seconds={seconds} />
      </div>

      {/* Depleting progress bar at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/10">
        <div
          className="h-full bg-highlight transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
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
