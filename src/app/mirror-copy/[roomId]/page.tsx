"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGameRoom } from "@/hooks/useGameRoom";
import { uploadMirrorImage, saveMirrorCopyUrl, updateRoomState } from "@/lib/supabase";
import Avatar, { DEFAULT_AVATAR } from "@/components/Avatar";

const COPY_SECS = 15;

export default function MirrorCopyPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [seconds, setSeconds] = useState(COPY_SECS);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [refImgError, setRefImgError] = useState(false);
  const uploadedRef = useRef(false);

  const r = room as any;
  const isImitator =
    (r?.current_poser === "player1" && room?.player2_id === playerId) ||
    (r?.current_poser === "player2" && room?.player1_id === playerId);

  const isUrgent = seconds <= 5;

  // Server-synced countdown
  useEffect(() => {
    const ts = r?.preview_started_at as string | null | undefined;
    if (!ts) return;
    const update = () => {
      const elapsed = (Date.now() - new Date(ts).getTime()) / 1000;
      setSeconds(Math.max(0, COPY_SECS - Math.floor(elapsed)));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.preview_started_at]);

  useEffect(() => {
    if (!isImitator) return;
    startCamera();
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImitator]);

  // Auto-capture at 0
  useEffect(() => {
    if (seconds === 0 && !photo && isImitator) takePhoto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, photo, isImitator]);

  // Host triggers scoring once mirror_copy_url is set
  useEffect(() => {
    if (!isHost || !room) return;
    if (!r?.mirror_copy_url) return;
    updateRoomState(roomId, "MIRROR_SCORING");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, r?.mirror_copy_url]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Autorise l'accès à la caméra.");
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
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }, [photo]);

  const retake = useCallback(() => {
    setPhoto(null);
    uploadedRef.current = false;
    startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-upload on photo capture
  useEffect(() => {
    if (!photo || uploadedRef.current) return;
    uploadedRef.current = true;
    setUploading(true);
    uploadMirrorImage(roomId, "copy", photo).then((url) => {
      if (url) saveMirrorCopyUrl(roomId, url);
      setUploading(false);
    });
  }, [photo, roomId]);

  if (loading) return <FullScreenSpinner />;
  if (error) return <FullScreenError message={error} />;
  if (!room) return null;

  const refUrl = r?.mirror_ref_url as string | null;

  // ── Poser waiting screen ───────────────────────────────────────────────────
  if (!isImitator) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-5xl">🪞</div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-purple-300">Round {r?.current_round ?? 1}</p>
          <h2 className="text-2xl font-black">L&apos;autre joueur imite ta pose…</h2>
          <p className="text-sm text-white/50">Attends le résultat !</p>
        </div>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
      </main>
    );
  }

  // ── Imitator camera screen ─────────────────────────────────────────────────
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden bg-black">
      {photo ? (
        <div className="relative flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Ta tentative"
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-center space-y-3">
            {uploading ? (
              <>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                <p className="text-sm text-white/60">Envoi en cours…</p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50">Photo envoyée — en attente du résultat…</p>
                <button
                  className="mt-2 min-h-[44px] rounded-[14px] border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium active:scale-[0.98]"
                  onClick={retake}
                >
                  Reprendre
                </button>
              </>
            )}
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

          {/* Progress bar */}
          <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/10">
            <div
              className="h-full bg-highlight transition-all duration-500"
              style={{ width: `${(seconds / COPY_SECS) * 100}%` }}
            />
          </div>

          {/* Timer */}
          <div
            className={[
              "absolute left-4 top-4 z-10 rounded-full px-5 py-3 text-3xl font-black tabular-nums transition-colors duration-300",
              isUrgent ? "bg-red-600 text-white" : "bg-black/75 text-white",
            ].join(" ")}
          >
            {seconds}
          </div>

          {/* Reference thumbnail */}
          {refUrl && !refImgError && (
            <div className="absolute right-4 top-4 z-10 h-28 w-20 overflow-hidden rounded-xl border-2 border-purple-500/60 shadow-lg">
              <Image
                src={refUrl}
                alt="Référence"
                fill
                className="object-cover scale-x-[-1]"
                unoptimized
                onError={() => setRefImgError(true)}
              />
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-x-4 top-20 z-10 rounded-2xl bg-red-500/90 p-4 text-center text-sm">
              {cameraError}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent p-5 pb-8 text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Imite la pose affichée en haut à droite !</p>
            <div className="flex gap-3">
              <button
                className="group relative overflow-hidden min-h-[54px] flex-1 rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] transition-all"
                onClick={takePhoto}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                Capturer
              </button>
              <button
                className="min-h-[54px] rounded-2xl border border-surface-border bg-surface px-6 py-4 text-base font-bold shadow-glass active:scale-[0.98] hover:bg-surface-hover transition-all"
                onClick={retake}
              >
                Reprendre
              </button>
            </div>
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
