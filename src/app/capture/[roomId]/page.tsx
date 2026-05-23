"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { updateRoomState } from "@/lib/supabase";

const DURATION = 15; // seconds to capture

export default function CapturePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [seconds, setSeconds] = useState(DURATION);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  // Server-synced countdown
  useEffect(() => {
    if (!room?.preview_started_at) return;

    const update = () => {
      const elapsed = (Date.now() - new Date(room.preview_started_at!).getTime()) / 1000;
      const remaining = Math.max(0, DURATION - Math.floor(elapsed));
      setSeconds(remaining);
    };

    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [room?.preview_started_at]);

  // Start camera when page loads
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Auto-capture when timer hits 0
  useEffect(() => {
    if (seconds === 0 && !photo) {
      takePhoto();
    }
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
    streamRef.current?.getTracks().forEach((t) => t.stop());
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

    // Store locally so scoring page can retrieve it
    localStorage.setItem("reframed_photo", dataUrl);
    localStorage.setItem("reframed_player_slot", room?.player1_id === playerId ? "1" : "2");

    // Host drives CAPTURE → SCORING
    if (isHost) {
      updateRoomState(roomId, "SCORING");
    }
  }, [photo, isHost, roomId, room?.player1_id, playerId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg message={error} />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-black relative overflow-hidden">
      {photo ? (
        // Preview captured photo
        <div className="flex flex-1 flex-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Ta pose" className="flex-1 object-cover w-full" />
          <div className="p-5 text-center">
            <p className="text-white/60 text-sm">Photo capturée — en attente de l&apos;adversaire…</p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="flex-1 min-h-[28rem] w-full scale-x-[-1] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Timer */}
          <div className="absolute left-4 top-4 rounded-full bg-black/75 px-5 py-3 text-3xl font-black tabular-nums">
            {seconds}
          </div>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-highlight transition-all duration-500"
              style={{ width: `${(seconds / DURATION) * 100}%` }}
            />
          </div>

          {cameraError && (
            <div className="absolute inset-x-4 top-20 rounded-2xl bg-red-500/90 p-4 text-sm text-center">
              {cameraError}
            </div>
          )}

          <button
            className="absolute inset-x-6 bottom-8 rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
            onClick={takePhoto}
          >
            Capturer maintenant
          </button>
        </>
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
