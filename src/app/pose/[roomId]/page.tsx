"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Camera, { type CameraHandle } from "@/components/Camera";
import CountdownTimer from "@/components/CountdownTimer";
import { useGameRoom, usePose } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import { uploadPlayerImage, savePlayerImageUrl } from "@/lib/storage";
import { playCameraShutter } from "@/lib/sounds";

const DURATION = 15;

export default function PosePage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);
  const cameraRef = useRef<CameraHandle>(null);

  const [seconds, setSeconds] = useState(DURATION);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const pose = usePose(room?.current_pose_id);
  const isActivePlayer = Boolean(
    playerId && room && (room.player1_id === playerId || room.player2_id === playerId),
  );

  // Server-synced countdown from preview_started_at
  useEffect(() => {
    const ts = (room as any)?.preview_started_at as string | null | undefined;
    if (!ts) return;
    const tick = () => {
      const elapsed = (Date.now() - new Date(ts).getTime()) / 1000;
      setSeconds(Math.max(0, DURATION - Math.floor(elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [(room as any)?.preview_started_at]);

  // Auto-capture when timer expires
  useEffect(() => {
    if (seconds === 0 && !uploaded && !uploading) {
      cameraRef.current?.capture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  // Host transitions to SCORING once both image URLs are present
  useEffect(() => {
    if (!isHost || !room || room.state !== "POSE") return;
    if (room.player1_image_url && room.player2_image_url) {
      void updateRoomState(roomId, "SCORING");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.player1_image_url, room?.player2_image_url]);

  const handleCapture = useCallback(
    async (base64: string) => {
      if (!playerId) return;
      void playCameraShutter();
      setUploading(true);
      setUploadError("");
      setUploaded(false);

      const url = await uploadPlayerImage(roomId, playerId, base64);
      if (!url) {
        setUploadError("Échec de l'envoi. Réessaie.");
        setUploading(false);
        return;
      }

      await savePlayerImageUrl(roomId, playerId, url);
      setUploaded(true);
      setUploading(false);
    },
    [roomId, playerId],
  );

  function handleRetake() {
    setUploaded(false);
    setUploading(false);
    setUploadError("");
  }

  if (loading) return <Screen><Spinner /></Screen>;
  if (error) return <Screen><p className="text-red-400 text-sm">{error}</p></Screen>;
  if (room?.mode === "royale" && !isActivePlayer) {
    return (
      <Screen>
        <div className="max-w-sm space-y-3 px-6 text-center">
          <p className="text-5xl">👑</p>
          <h2 className="text-2xl font-black">Tu observes ce round</h2>
          <p className="text-sm text-white/50">
            MVP Battle Royale: les deux premiers joueurs font le duel, les autres suivent le résultat.
          </p>
        </div>
      </Screen>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-black">
      {/* Camera fills full screen */}
      <Camera
        ref={cameraRef}
        ghost={pose?.imageUrl}
        onCapture={handleCapture}
        onRetake={handleRetake}
        className="absolute inset-0 h-full w-full"
      />

      {/* UI overlay */}
      <div className="relative flex flex-1 flex-col">
        {/* Top bar: countdown left, pose name right */}
        <div className="flex items-start justify-between p-4">
          <CountdownTimer seconds={seconds} urgent={seconds <= 5} />

          {pose && (
            <div className="max-w-[150px] rounded-2xl border border-surface-border bg-surface px-4 py-2.5 text-right shadow-glass backdrop-blur-md">
              <p className="text-xs font-bold leading-tight text-white truncate">{pose.title}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/40 truncate">{pose.artist}</p>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Status banners */}
        <div className="mx-4 mb-2 space-y-2">
          {uploading && (
            <div className="rounded-2xl bg-black/70 p-3 text-center text-sm backdrop-blur-sm">
              <span className="text-white/60">Envoi en cours…</span>
            </div>
          )}
          {uploaded && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/15 p-3 text-center text-sm backdrop-blur-sm">
              <span className="text-green-300">
                ✓ Photo envoyée — en attente de l&apos;adversaire…
              </span>
            </div>
          )}
          {uploadError && (
            <div className="rounded-2xl bg-red-500/20 p-3 text-center text-sm">
              <span className="text-red-400">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!uploaded && (
          <div className="flex gap-3 p-4 pb-8">
            <button
              className="group relative overflow-hidden min-h-[54px] flex-1 rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-40 transition-all"
              onClick={() => cameraRef.current?.capture()}
              disabled={uploading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {uploading ? "Envoi…" : "Capturer"}
            </button>
            <button
              className="min-h-[54px] rounded-2xl border border-surface-border bg-surface px-6 py-4 text-base font-bold shadow-glass active:scale-[0.98] hover:bg-surface-hover transition-all"
              onClick={handleRetake}
            >
              Reprendre
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Screen({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center">{children}</main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
  );
}
