"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface CameraHandle {
  /** Snap the current frame and call onCapture with the base64 image. */
  capture: () => void;
}

interface CameraProps {
  /** Reference pose image URL shown as a ghost guide overlay. */
  ghost?: string;
  /** Called every time a photo is committed (including after retake). */
  onCapture: (base64: string) => void;
  /** Called when the user taps "Reprendre" so the parent can reset upload state. */
  onRetake?: () => void;
  className?: string;
}

type Phase = "loading" | "live" | "captured" | "error";

const MAX_DIM = 800;

const Camera = forwardRef<CameraHandle, CameraProps>(function Camera(
  { ghost, onCapture, onRetake, className = "" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [photo, setPhoto] = useState<string | null>(null);
  const [retakeUsed, setRetakeUsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setPhase("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase("live");
    } catch (err) {
      const isDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setErrorMsg(
        isDenied
          ? "Accès caméra refusé. Autorise la caméra dans les réglages de ton navigateur, puis recharge la page."
          : "Impossible d'ouvrir la caméra. Assure-toi d'être sur HTTPS.",
      );
      setPhase("error");
    }
  }, []);

  const doCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || phase !== "live") return;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.min(MAX_DIM / vw, MAX_DIM / vh, 1);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The video is CSS-mirrored (scale-x-[-1]); mirror the canvas too so
    // the exported image matches what the user actually looks like.
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(base64);
    setPhase("captured");
    stopStream();
    onCapture(base64);
  }, [phase, stopStream, onCapture]);

  useImperativeHandle(ref, () => ({ capture: doCapture }), [doCapture]);

  useEffect(() => {
    void startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  function handleRetake() {
    if (retakeUsed) return;
    setRetakeUsed(true);
    setPhoto(null);
    onRetake?.();
    void startCamera();
  }

  // ── render ─────────────────────────────────────────────────────────────────

  if (phase === "error") {
    return (
      <div
        className={`flex items-center justify-center bg-black p-8 text-center ${className}`}
      >
        <p className="text-sm text-red-400">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`h-full w-full object-cover scale-x-[-1] ${phase === "captured" ? "hidden" : ""}`}
      />

      {/* Frozen photo preview */}
      {phase === "captured" && photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="Capture" className="h-full w-full object-cover" />
      )}

      {/* Loading spinner */}
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      )}

      {/* Ghost overlay — pose silhouette at 15 % opacity */}
      {ghost && phase !== "captured" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ghost}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.15, mixBlendMode: "screen" }}
        />
      )}

      {/* Retake button — one shot, disappears after use */}
      {phase === "captured" && !retakeUsed && (
        <button
          className="absolute bottom-4 right-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm active:scale-[0.97]"
          onClick={handleRetake}
        >
          Reprendre
        </button>
      )}
    </div>
  );
});

export default Camera;
