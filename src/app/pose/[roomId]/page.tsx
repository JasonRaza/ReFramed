"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Camera, { type CameraHandle } from "@/components/Camera";
import CountdownTimer from "@/components/CountdownTimer";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import { uploadPlayerImage, savePlayerImageUrl } from "@/lib/storage";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

const DURATION = 15;

export default function PosePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);
  const cameraRef = useRef<CameraHandle>(null);

  const [seconds, setSeconds] = useState(DURATION);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Server-synced countdown from preview_started_at
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
        {/* Top bar */}
        <div className="flex items-start justify-between p-4">
          <div className="rounded-2xl bg-black/60 px-4 py-2 backdrop-blur-sm">
            <CountdownTimer seconds={seconds} urgent={seconds <= 8} />
          </div>

          {pose && (
            <div className="max-w-[140px] rounded-xl bg-black/60 px-3 py-2 text-right backdrop-blur-sm">
              <p className="text-xs font-medium text-white/80 leading-tight">{pose.title}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{pose.artist}</p>
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

        {/* Capture button */}
        {!uploaded && (
          <div className="p-4 pb-8">
            <button
              className="w-full rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-40"
              onClick={() => cameraRef.current?.capture()}
              disabled={uploading}
            >
              {uploading ? "Envoi…" : "Capturer"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center">{children}</main>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
  );
}
