"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { playFanfare } from "@/lib/sounds";
import poses from "@/lib/poses.json";
import type { Pose } from "@/lib/game";

// ── inline confetti ───────────────────────────────────────────────────────────
function launchConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const colors = ["#7c3aed", "#a855f7", "#fbbf24", "#f472b6", "#ffffff"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    w: 7 + Math.random() * 7,
    h: 4 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: 2.5 + Math.random() * 4,
    angle: Math.random() * Math.PI * 2,
    va: (Math.random() - 0.5) * 0.18,
  }));
  let raf: number;
  const start = Date.now();
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let done = 0;
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.angle += p.va;
      if (p.y > canvas.height) done++;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - (Date.now() - start) / 3500);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (done < pieces.length && Date.now() - start < 3500) raf = requestAnimationFrame(draw);
    else canvas.remove();
  }
  raf = requestAnimationFrame(draw);
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 4000);
}

// ── eased count-up ────────────────────────────────────────────────────────────
function useCountUp(target: number, delay = 0): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const t0 = performance.now() + delay;
    let raf: number;
    function tick(now: number) {
      const elapsed = Math.max(0, now - t0);
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay]);
  return val;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const { room, loading, error, isHost } = useGameRoom(roomId);
  const router = useRouter();

  const p1Score = useCountUp(room?.player1_score ?? 0, 300);
  const p2Score = useCountUp(room?.player2_score ?? 0, 600);

  const pose = room?.current_pose_id
    ? (poses as Pose[]).find((p) => p.id === room.current_pose_id) ?? null
    : null;

  // Confetti + fanfare on mount
  useEffect(() => {
    const t = setTimeout(launchConfetti, 400);
    const s = setTimeout(() => { void playFanfare(); }, 300);
    return () => { clearTimeout(t); clearTimeout(s); };
  }, []);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;
  if (!room) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = room as any;
  const isDraw = r.winner === "tie" || r.winner === "draw";
  const p1Wins = !isDraw && r.winner === "player1";
  const p2Wins = !isDraw && r.winner === "player2";

  const winnerLabel = isDraw
    ? "Égalité artistique"
    : p1Wins
      ? (isHost ? "Tu gagnes !" : "Joueur 1 gagne !")
      : (isHost ? "Tu perds…" : "Joueur 2 gagne !");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-5 gap-4">

      {/* Winner badge */}
      <div className="text-center space-y-1">
        {!isDraw && <div className="text-3xl">👑</div>}
        <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Résultats</p>
        <h2 className={`text-3xl font-black ${p1Wins || p2Wins ? "text-yellow-300" : ""}`}>
          {winnerLabel}
        </h2>
      </div>

      {/* 3 images: reference | p1 | p2 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Reference */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
            {pose && (
              <Image src={pose.imageUrl} alt={pose.title} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="p-2 text-center">
            <p className="text-[10px] leading-tight text-white/40">Référence</p>
          </div>
        </div>

        <PlayerCard
          label={isHost ? "Toi" : "Joueur 1"}
          imageUrl={r.player1_image_url ?? null}
          score={p1Score}
          roast={r.player1_roast ?? null}
          isWinner={p1Wins}
          delay={300}
        />

        <PlayerCard
          label={!isHost ? "Toi" : "Joueur 2"}
          imageUrl={r.player2_image_url ?? null}
          score={p2Score}
          roast={r.player2_roast ?? null}
          isWinner={p2Wins}
          delay={600}
        />
      </div>

      <div className="flex-1" />

      <button
        className="min-h-[44px] w-full rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
        onClick={() => router.push("/lobby")}
      >
        Rejouer
      </button>
    </main>
  );
}

// ── PlayerCard ────────────────────────────────────────────────────────────────

function PlayerCard({
  label,
  imageUrl,
  score,
  roast,
  isWinner,
  delay,
}: {
  label: string;
  imageUrl: string | null;
  score: number;
  roast: string | null;
  isWinner: boolean;
  delay: number;
}) {
  const displayed = useCountUp(score, delay);
  return (
    <div
      className={[
        "flex flex-col overflow-hidden rounded-2xl border transition-all",
        isWinner
          ? "border-yellow-400/60 bg-yellow-400/10 scale-[1.02]"
          : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      {isWinner && <div className="py-1 text-center text-sm">👑</div>}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        {imageUrl ? (
          <Image src={imageUrl} alt={label} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/20">—</div>
        )}
      </div>
      <div className="space-y-1 p-3 text-center">
        <p className="text-xs text-white/40">{label}</p>
        <p className={`text-3xl font-black tabular-nums ${isWinner ? "text-yellow-400" : ""}`}>
          {displayed}
        </p>
        {roast && (
          <p className="text-[11px] italic leading-tight text-white/40">{roast}</p>
        )}
      </div>
    </div>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6">
      {children}
    </main>
  );
}

function Spinner() {
  return <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-highlight" />;
}
