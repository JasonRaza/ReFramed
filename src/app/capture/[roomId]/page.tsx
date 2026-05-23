"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

const DURATION = 15;
const URGENT_AT = 8;

export default function CapturePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [seconds, setSeconds] = useState(DURATION);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  const isUrgent = seconds <= URGENT_AT;

  // Server-synced countdown
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = (room as any)?.preview_started_at as string | null | undefined;
    if (!ts) return;
    const update = () => {
      const elapsed = (Date.now() - new Date(ts).getTime()) / 1000;
      setSeconds(Math.max(0, DURATION - Math.floor(elapsed)));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, [(room as any)?.preview_started_at]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds === 0 && !photo) takePhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, photo]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Autorise l'accès à la caméra dans Safari ou Chrome.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    streamRef.current = null;
  }

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || photo) return;

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(dataUrl);
    stopCamera();

    localStorage.setItem("reframed_photo", dataUrl);
    localStorage.setItem("reframed_player_slot", room?.player1_id === playerId ? "1" : "2");

    if (isHost) updateRoomState(roomId, "SCORING");
  }, [photo, isHost, roomId, room?.player1_id, playerId]);

  const retake = useCallback(() => {
    setPhoto(null);
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <FullScreenSpinner />;
  if (error) return <FullScreenError message={error} />;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-black">
      {photo ? (
        <div className="relative flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Ta pose"
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-center">
            <p className="text-sm text-white/50">
              Photo capturée — en attente de l&apos;adversaire…
            </p>
            <button
              className="mt-4 min-h-[44px] rounded-[14px] border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium active:scale-[0.98]"
              onClick={retake}
            >
              Reprendre
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/10">
            <div
              className="h-full bg-highlight transition-all duration-500"
              style={{ width: `${(seconds / DURATION) * 100}%` }}
            />
          </div>

          <div
            className={[
              "absolute left-4 top-4 z-10 rounded-full px-5 py-3 text-3xl font-black tabular-nums transition-colors duration-300",
              isUrgent ? "bg-red-600 text-white" : "bg-black/75 text-white",
            ].join(" ")}
          >
            {seconds}
          </div>

          {pose && (
            <div className="absolute right-4 top-4 z-10 max-w-[130px] text-right">
              <p className="text-xs leading-tight text-white/40">{pose.title}</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-x-4 top-20 z-10 rounded-2xl bg-red-500/90 p-4 text-center text-sm">
              {cameraError}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 p-5 pb-8">
            <button
              className="min-h-[44px] flex-1 rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
              onClick={takePhoto}
            >
              Capturer
            </button>
            <button
              className="min-h-[44px] rounded-[14px] border border-white/20 bg-white/10 px-5 py-4 text-base font-medium active:scale-[0.98]"
              onClick={retake}
            >
              Reprendre
            </button>
          </div>
        </>
      )}
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
