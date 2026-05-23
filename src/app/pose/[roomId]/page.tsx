"use client";

import { use, useEffect, useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";

const DURATION = 5; // seconds to get into position before capture starts

export default function PosePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const [seconds, setSeconds] = useState(DURATION);

  // Server-synced countdown
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

  // Host drives the POSE → CAPTURE transition
  useEffect(() => {
    if (!isHost || seconds > 0) return;
    updateRoomState(roomId, "CAPTURE");
  }, [isHost, seconds, roomId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center gap-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-200">Prends ta pose !</p>
        <p className="text-8xl font-black">💪</p>
        <p className="text-white/60 text-sm leading-relaxed">
          La référence a disparu.<br />Mets ton corps en danger artistique.
        </p>
      </div>

      {seconds > 0 ? (
        <div className="text-7xl font-black tabular-nums text-highlight">{seconds}</div>
      ) : (
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
      )}
    </main>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}
