"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import poses from "@/lib/poses.json";
import type { GameState, Pose, ScoreResult } from "@/lib/game";
import { isSupabaseConfigured } from "@/lib/supabase";

const orderedStates: GameState[] = [
  "LOBBY",
  "PREVIEW",
  "POSE",
  "CAPTURE",
  "SCORING",
  "RESULTS",
];

const stateLabels: Record<GameState, string> = {
  LOBBY: "Salon",
  PREVIEW: "Aperçu",
  POSE: "Pose",
  CAPTURE: "Capture",
  SCORING: "Score",
  RESULTS: "Résultats",
};

const roasts = [
  "On dirait une statue qui a raté son bus.",
  "Le Louvre appelle, il veut récupérer son brouillon.",
  "Beau chaos corporel. Presque de l'art.",
  "La pose est là. La dignité, beaucoup moins.",
];

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function stripDataUrl(dataUrl: string) {
  return dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<GameState>("LOBBY");
  const [roomCode, setRoomCode] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const pose = useMemo(() => (poses as Pose[])[0], []);

  useEffect(() => {
    if (state === "PREVIEW") {
      setSeconds(5);
    }

    if (state === "CAPTURE") {
      setSeconds(15);
      startCamera();
    }

    if (state !== "CAPTURE") {
      stopCamera();
    }

    return () => {
      if (state === "CAPTURE") {
        stopCamera();
      }
    };
  }, [state]);

  useEffect(() => {
    if (seconds <= 0) {
      if (state === "PREVIEW") {
        setState("POSE");
      }

      if (state === "CAPTURE" && !photo) {
        takePhoto();
      }

      return;
    }

    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds, state, photo]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Impossible d'ouvrir la caméra. Autorise Safari ou Chrome à l'utiliser.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    setState("SCORING");
  }

  const scorePhoto = useCallback(async (capturedPhoto: string) => {
    const fallback: ScoreResult = {
      playerScore: 72,
      opponentScore: 68,
      winner: "player",
      roast: roasts[Math.floor(Math.random() * roasts.length)],
    };

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poseId: pose.id,
          playerImageBase64: stripDataUrl(capturedPhoto),
          opponentImageBase64: stripDataUrl(capturedPhoto),
        }),
      });

      if (!response.ok) {
        throw new Error("Score indisponible");
      }

      setResult((await response.json()) as ScoreResult);
    } catch {
      setResult(fallback);
    } finally {
      setState("RESULTS");
    }
  }, [pose.id]);

  useEffect(() => {
    if (state === "SCORING" && photo) {
      void scorePhoto(photo);
    }
  }, [state, photo, scorePhoto]);

  function createRoom() {
    setRoomCode(makeRoomCode());
    setPhoto(null);
    setResult(null);
    setState("PREVIEW");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-6 pt-4">
      <header className="flex items-center justify-between py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-purple-200">Duel 1v1</p>
          <h1 className="text-4xl font-black tracking-tight">ReFramed</h1>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          {roomCode || "----"}
        </div>
      </header>

      <section className="mb-4 grid grid-cols-6 gap-1">
        {orderedStates.map((item) => (
          <div
            key={item}
            className={`h-2 rounded-full ${
              orderedStates.indexOf(item) <= orderedStates.indexOf(state)
                ? "bg-highlight"
                : "bg-white/10"
            }`}
            title={stateLabels[item]}
          />
        ))}
      </section>

      <section className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-glow">
        {state === "LOBBY" && (
          <div className="flex flex-1 flex-col justify-between p-6">
            <div className="space-y-5">
              <div className="rounded-3xl bg-primary/20 p-4 text-sm text-purple-100">
                Montre la pose pendant 5 secondes, cache-la, puis recrée-la en 15 secondes.
                Claude note uniquement les images et balance un roast.
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p>États: LOBBY → PREVIEW → POSE → CAPTURE → SCORING → RESULTS</p>
                <p>
                  Supabase: {isSupabaseConfigured ? "prêt" : "à configurer dans .env.local"}
                </p>
              </div>
            </div>
            <button
              className="rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
              onClick={createRoom}
            >
              Créer un salon
            </button>
          </div>
        )}

        {state === "PREVIEW" && (
          <div className="flex flex-1 flex-col">
            <div className="relative flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={pose.title} className="h-full w-full object-cover" src={pose.imageUrl} />
              <div className="absolute right-4 top-4 rounded-full bg-black/70 px-4 py-2 text-3xl font-black">
                {seconds}
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-purple-200">
                Mémorise la pose
              </p>
              <h2 className="text-2xl font-black">{pose.title}</h2>
              <p className="text-white/60">{pose.artist}</p>
            </div>
          </div>
        )}

        {state === "POSE" && (
          <div className="flex flex-1 flex-col justify-center gap-6 p-6 text-center">
            <p className="text-7xl font-black">Pose !</p>
            <p className="text-white/70">La référence a disparu. Mets ton corps en danger artistique.</p>
            <button
              className="rounded-2xl bg-primary px-5 py-4 text-lg font-bold"
              onClick={() => setState("CAPTURE")}
            >
              Lancer la caméra
            </button>
          </div>
        )}

        {state === "CAPTURE" && (
          <div className="relative flex flex-1 flex-col bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full min-h-[28rem] w-full scale-x-[-1] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute left-4 top-4 rounded-full bg-black/70 px-4 py-2 text-3xl font-black">
              {seconds}
            </div>
            {cameraError && (
              <div className="absolute inset-x-4 top-24 rounded-2xl bg-red-500/90 p-4 text-sm">
                {cameraError}
              </div>
            )}
            <button
              className="absolute inset-x-8 bottom-6 rounded-2xl bg-primary px-5 py-4 text-lg font-bold"
              onClick={takePhoto}
            >
              Capturer maintenant
            </button>
          </div>
        )}

        {state === "SCORING" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
            <h2 className="text-3xl font-black">Claude juge...</h2>
            <p className="text-white/70">Aucun ego n&apos;est couvert par l&apos;assurance.</p>
          </div>
        )}

        {state === "RESULTS" && result && (
          <div className="flex flex-1 flex-col justify-between p-6">
            <div className="space-y-5 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-purple-200">Résultat</p>
              <h2 className="text-4xl font-black">
                {result.winner === "draw" ? "Égalité douteuse" : "Victoire joueur 1"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-sm text-white/60">Joueur 1</p>
                  <p className="text-4xl font-black">{result.playerScore}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-sm text-white/60">Joueur 2</p>
                  <p className="text-4xl font-black">{result.opponentScore}</p>
                </div>
              </div>
              <p className="rounded-3xl bg-highlight/20 p-4 text-lg font-bold">{result.roast}</p>
            </div>
            <button
              className="rounded-2xl bg-primary px-5 py-4 text-lg font-bold"
              onClick={createRoom}
            >
              Rejouer
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
