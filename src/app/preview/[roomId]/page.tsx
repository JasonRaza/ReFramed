"use client";

import { useEffect, useState } from "react";
import { useGameRoom, usePose } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import PoseCard from "@/components/PoseCard";
import CountdownTimer from "@/components/CountdownTimer";
import CountdownAccelerator from "@/components/CountdownAccelerator";

const DURATION = 5;

export default function PreviewPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [seconds, setSeconds] = useState(DURATION);
  const pose = usePose(room?.current_pose_id);

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
      {/* Full-screen pose image */}
      <PoseCard pose={pose} size="full" />

      {/* "Mémorise" badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="rounded-full bg-black/60 border border-white/15 px-3 py-1.5">
          <p className="text-xs font-semibold text-white/80">Mémorise la pose</p>
        </div>
      </div>

      {/* Big countdown */}
      <div className="absolute right-4 top-5 z-10">
        <CountdownTimer seconds={seconds} urgent={seconds <= 2} />
      </div>

      {isHost && seconds > 0 && (
        <div className="absolute inset-x-4 bottom-5 z-20">
          <CountdownAccelerator roomId={roomId} totalSeconds={DURATION} currentSeconds={seconds} />
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-1.5 bg-white/10">
        <div
          className="h-full bg-highlight transition-all duration-500 ease-linear"
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
