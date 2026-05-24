"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getProfile } from "@/hooks/useGameRoom";
import { fetchRandomPose } from "@/lib/supabase";
import Avatar, { DEFAULT_AVATAR } from "@/components/Avatar";
import type { Pose, PracticeResult } from "@/lib/game";

type Phase = "ready" | "preview" | "pose" | "scoring" | "result";

const PREVIEW_SECS = 5;
const POSE_SECS = 15;

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(from: number, active: boolean, onDone: () => void) {
  const [secs, setSecs] = useState(from);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) { setSecs(from); doneRef.current = false; return; }
    doneRef.current = false;
    setSecs(from);
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, from - elapsed);
      setSecs(remaining);
      if (remaining === 0 && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(id);
        onDone();
      }
    }, 200);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return secs;
}

// ─── Camera ───────────────────────────────────────────────────────────────────

function PracticeCamera({
  ghost,
  onCapture,
}: {
  ghost?: string;
  onCapture: (base64: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camPhase, setCamPhase] = useState<"loading" | "live" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            if (!cancelled) throw playError;
            return;
          }
        }
        if (cancelled) return;
        setCamPhase("live");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Caméra inaccessible");
        setCamPhase("error");
      }
    }
    void start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || camPhase !== "live") return;
    const canvas = document.createElement("canvas");
    const w = Math.min(video.videoWidth, 800);
    const h = Math.round(w * (video.videoHeight / video.videoWidth));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    stopStream();
    onCapture(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
  }

  if (camPhase === "error") {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/60 rounded-3xl p-8 text-center">
        <p className="text-sm text-red-400">{errorMsg || "Impossible d'accéder à la caméra."}</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden rounded-3xl bg-black">
      <video
        ref={videoRef}
        autoPlay muted playsInline
        className="h-full w-full object-cover scale-x-[-1]"
      />
      {ghost && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ghost} alt="" aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.35 }}
        />
      )}
      {camPhase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      )}
      <button
        onClick={capture}
        disabled={camPhase !== "live"}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-white/30 active:scale-90 transition-all disabled:opacity-50 shadow-lg"
      />
    </div>
  );
}

// ─── Eased count-up ───────────────────────────────────────────────────────────

function useCountUp(target: number): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const t0 = performance.now();
    let raf: number;
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const displayed = useCountUp(score);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (displayed / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#a855f7" : "#f97316";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute inset-0 -rotate-90" width="128" height="128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
      </svg>
      <span className="text-4xl font-black tabular-nums">{displayed}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const router = useRouter();
  const profile = getProfile();
  const avatar = profile?.avatar ?? DEFAULT_AVATAR;
  const username = profile?.username ?? "Joueur";

  const [phase, setPhase] = useState<Phase>("ready");
  const [pose, setPose] = useState<Pose | null>(null);
  const [loadingPose, setLoadingPose] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [poseImgError, setPoseImgError] = useState(false);

  useEffect(() => {
    fetchRandomPose().then((p) => { setPose(p); setLoadingPose(false); });
  }, []);

  const previewActive = phase === "preview";
  const poseActive = phase === "pose";

  const previewSecs = useCountdown(PREVIEW_SECS, previewActive, () => setPhase("pose"));
  const poseSecs = useCountdown(POSE_SECS, poseActive, () => {
    // auto-capture handled by camera imperatively — just transition if somehow missed
  });

  async function handleCapture(base64: string) {
    if (!pose) return;

    setPhoto(base64);
    setPhase("scoring");
    try {
      const res = await fetch("/api/score-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poseId: pose.id, playerBase64: base64 }),
      });
      const data = await res.json() as PracticeResult;
      setResult(data);
    } catch {
      setResult({ score: 50, roast: "L'IA a pris une pause café. Pas mal quand même !" });
    }
    setPhase("result");
  }

  function handleReplay() {
    setLoadingPose(true);
    fetchRandomPose().then((p) => { setPose(p); setLoadingPose(false); });
    setPhoto(null);
    setResult(null);
    setPoseImgError(false);
    setPhase("ready");
  }

  if (loadingPose || !pose) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
        <p className="text-white/40 text-sm">Chargement de la pose…</p>
      </main>
    );
  }

  // ── READY ──────────────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-6 gap-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Entraînement</p>
            <h1 className="text-3xl font-black">Pose Solo</h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white/60 active:scale-95"
          >
            ← Menu
          </button>
        </header>

        <div className="flex items-center gap-3 rounded-2xl bg-surface border border-surface-border shadow-glass px-4 py-3">
          <Avatar avatar={avatar} size="md" />
          <div>
            <p className="font-bold text-white/90">{username}</p>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Mode entraînement</p>
          </div>
        </div>

        {/* Pose preview card */}
        <div className="relative overflow-hidden rounded-3xl aspect-[3/4] w-full bg-ink border border-surface-border shadow-glass">
          {!poseImgError ? (
            <Image
              src={pose.imageUrl} alt={pose.title}
              fill className="object-cover" unoptimized
              onError={() => setPoseImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-ink" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/60 to-transparent px-5 pb-6 pt-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Pose du jour</p>
            <p className="text-2xl font-black tracking-tight">{pose.title}</p>
            <p className="text-sm font-medium text-white/50">{pose.artist}</p>
          </div>
        </div>

        <p className="text-center text-sm font-medium text-white/50">
          Tu auras <strong className="text-white">5 sec</strong> pour mémoriser, puis{" "}
          <strong className="text-white">15 sec</strong> pour recréer la pose.
        </p>

        <div className="flex-1" />

        <button
          className="group relative overflow-hidden min-h-[54px] w-full rounded-2xl bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] transition-all"
          onClick={() => setPhase("preview")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          Commencer
        </button>

        <button
          className="text-sm font-bold uppercase tracking-wider text-white/30 hover:text-white/60 active:text-white/80 text-center py-2 transition-colors"
          onClick={handleReplay}
        >
          Changer de pose →
        </button>
      </main>
    );
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (phase === "preview") {
    return (
      <main className="relative flex min-h-dvh flex-col overflow-hidden bg-black">
        {!poseImgError ? (
          <Image
            src={pose.imageUrl} alt={pose.title}
            fill className="object-cover opacity-90" unoptimized priority
            onError={() => setPoseImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
        )}
        {/* Countdown overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 px-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Mémorise !</p>
            <div className="text-8xl font-black tabular-nums drop-shadow-lg">{previewSecs}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-200 ease-linear"
            style={{ width: `${((PREVIEW_SECS - previewSecs) / PREVIEW_SECS) * 100}%` }}
          />
        </div>
        {/* Pose info */}
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/70 to-transparent px-6 pt-10 pb-8">
          <p className="text-xl font-black">{pose.title}</p>
          <p className="text-sm text-white/60">{pose.artist}</p>
        </div>
      </main>
    );
  }

  // ── POSE (capture) ─────────────────────────────────────────────────────────
  if (phase === "pose") {
    const progress = ((POSE_SECS - poseSecs) / POSE_SECS) * 100;
    const urgent = poseSecs <= 5;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-6 pt-4 gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white/60">Recrée la pose !</p>
          <p className={`text-2xl font-black tabular-nums ${urgent ? "text-orange-400" : ""}`}>
            {poseSecs}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${urgent ? "bg-orange-400" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <PracticeCamera ghost={pose.imageUrl} onCapture={handleCapture} />
      </main>
    );
  }

  // ── SCORING ────────────────────────────────────────────────────────────────
  if (phase === "scoring") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />
        <p className="text-lg font-bold">Claude juge ta pose…</p>
        <p className="text-sm text-white/40">Ça prend quelques secondes</p>
      </main>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const score = result.score;
    const medal = score >= 90 ? "🥇" : score >= 70 ? "🥈" : score >= 50 ? "🥉" : "😬";

    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-6 gap-5">
        <div className="text-center space-y-1">
          <p className="text-4xl">{medal}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Résultat</p>
        </div>

        {/* Score + player */}
        <div className="flex items-center justify-center gap-6 rounded-3xl bg-surface border border-surface-border shadow-glass py-6">
          <Avatar avatar={avatar} size="lg" />
          <ScoreRing score={score} />
        </div>

        {/* Roast */}
        <div className="rounded-2xl bg-surface border border-surface-border shadow-glass px-5 py-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Le verdict de Claude</p>
          <p className="italic font-medium text-white/80">&ldquo;{result.roast}&rdquo;</p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center">Référence</p>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-ink border border-surface-border shadow-glass">
              {!poseImgError ? (
                <Image
                  src={pose.imageUrl} alt={pose.title}
                  fill className="object-cover" unoptimized
                  onError={() => setPoseImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-ink" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center">Ta pose</p>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-ink border border-surface-border shadow-glass">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/jpeg;base64,${photo}`} alt="Ta pose" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            className="flex-1 rounded-2xl bg-surface border border-surface-border shadow-glass px-4 py-4 font-bold active:scale-[0.98] hover:bg-surface-hover transition-all"
            onClick={handleReplay}
          >
            Rejouer
          </button>
          <button
            className="flex-1 rounded-2xl bg-primary px-4 py-4 font-bold shadow-glow active:scale-[0.98] transition-all"
            onClick={() => router.push("/")}
          >
            Menu
          </button>
        </div>
      </main>
    );
  }

  return null;
}
