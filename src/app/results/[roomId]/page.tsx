"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameRoom, usePose } from "@/hooks/useGameRoom";
import { playFanfare } from "@/lib/sounds";
import { startNextRankedRound, startNextRoyaleRound } from "@/lib/supabase";
import { applyRankDeltaOnce, getRankSnapshot, rankDeltaForResult, type RankSnapshot } from "@/lib/rank";
import Avatar, { DEFAULT_AVATAR } from "@/components/Avatar";
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
  const { room, loading, error, isHost, playerId } = useGameRoom(roomId);
  const router = useRouter();
  const [rank, setRank] = useState<RankSnapshot | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const p1Score = useCountUp(room?.player1_score ?? 0, 300);
  const p2Score = useCountUp(room?.player2_score ?? 0, 600);

  const pose = usePose(room?.current_pose_id);
  const r = room as any;
  const isDraw = r?.winner === "tie" || r?.winner === "draw";
  const p1Wins = !isDraw && r?.winner === "player1";
  const p2Wins = !isDraw && r?.winner === "player2";
  const isRanked = r?.mode === "ranked";
  const isRoyale = r?.mode === "royale";
  const rankedP1Rounds = r?.ranked_player1_rounds ?? 0;
  const rankedP2Rounds = r?.ranked_player2_rounds ?? 0;
  const currentRound = r?.current_round ?? 1;
  const totalRounds = r?.total_rounds ?? (isRanked ? 5 : 1);
  const rankedMatchDone = isRanked && (
    rankedP1Rounds >= 3 ||
    rankedP2Rounds >= 3 ||
    currentRound >= totalRounds
  );

  // Royale state
  const royalePlayers = (r?.royale_players ?? []) as import("@/lib/game").RoyalePlayer[];
  const royaleImages = (r?.royale_player_images ?? {}) as Record<string, string>;
  const royaleActive = royalePlayers.filter((p) => !p.eliminated);
  const royaleGameOver = isRoyale && royaleActive.length <= 1;
  const royaleWinner = royaleGameOver ? royaleActive[0] ?? null : null;
  const royaleEliminated = royalePlayers.find(
    (p) => p.eliminatedRound === currentRound,
  ) ?? null;
  const localSlot = playerId && room?.player1_id === playerId ? "player1" : "player2";
  const localResult = isDraw
    ? "draw"
    : (localSlot === "player1" && p1Wins) || (localSlot === "player2" && p2Wins)
      ? "win"
      : "loss";
  const rankDelta = rankDeltaForResult(localResult);

  // Confetti + fanfare on mount
  useEffect(() => {
    const t = setTimeout(launchConfetti, 400);
    const s = setTimeout(() => { void playFanfare(); }, 300);
    return () => { clearTimeout(t); clearTimeout(s); };
  }, []);

  useEffect(() => {
    if (!isRanked || !room) return;
    if (!rankedMatchDone) {
      setRank(getRankSnapshot());
      return;
    }
    setRank(applyRankDeltaOnce(roomId, rankDelta));
  }, [isRanked, rankedMatchDone, rankDelta, room, roomId]);

  if (loading) return <Shell><Spinner /></Shell>;
  if (error) return <Shell><p className="text-red-400 text-sm">{error}</p></Shell>;
  if (!room) return null;

  const winnerLabel = isDraw
    ? "Égalité artistique"
    : p1Wins
      ? (isHost ? "Tu gagnes !" : "Joueur 1 gagne !")
      : (isHost ? "Tu perds…" : "Joueur 2 gagne !");

  async function handleNextRankedRound() {
    if (!room) return;
    setAdvancing(true);
    await startNextRankedRound(room);
  }

  async function handleNextRoyaleRound() {
    if (!room) return;
    setAdvancing(true);
    await startNextRoyaleRound(room);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-5 gap-4 animate-fade-up">

      {/* Winner badge */}
      <div className="text-center space-y-1 pt-2">
        {!isDraw && <div className="text-4xl">{p1Wins === (isHost) ? "🏆" : "😤"}</div>}
        {isDraw && <div className="text-4xl">🤝</div>}
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-400">Résultats</p>
        {isRanked && (
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-200">
            Round {currentRound} / {totalRounds} · {rankedP1Rounds}-{rankedP2Rounds}
          </p>
        )}
        <h2 className={`text-3xl font-black ${p1Wins || p2Wins ? "text-yellow-300" : ""}`}>
          {isRanked && !rankedMatchDone ? "Round terminé" : winnerLabel}
        </h2>
        {isRanked && (
          <div className="mx-auto inline-flex flex-col rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-200">
            <span>{rankedMatchDone ? "Match classé terminé" : "Best of 5 en cours"}</span>
            {rankedMatchDone && rank && (
              <span className="text-xs text-yellow-100/80">
                Rang: {rank.label} · {rank.points} pts ({rankDelta >= 0 ? "+" : ""}{rankDelta})
              </span>
            )}
          </div>
        )}
        {isRoyale && !royaleGameOver && royaleEliminated && (
          <p className="mx-auto inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200">
            💀 {royaleEliminated.username ?? "Joueur"} éliminé — {royaleActive.length} joueur{royaleActive.length > 1 ? "s" : ""} restant{royaleActive.length > 1 ? "s" : ""}
          </p>
        )}
        {isRoyale && royaleGameOver && royaleWinner && (
          <p className="mx-auto inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-100">
            🏆 {royaleWinner.username ?? "Joueur"} remporte le Battle Royale !
          </p>
        )}
      </div>

      {/* Images */}
      {isRoyale ? (
        /* ── Battle Royale: grille de tous les joueurs ── */
        <div className="space-y-3">
          {/* Reference pose */}
          <div className="grid grid-cols-3 gap-2">
            <ReferenceCard pose={pose} />
            {/* Best scorer badge */}
            {(() => {
              const sorted = [...royalePlayers]
                .filter((p) => (p.score ?? -1) >= 0)
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
              const best = sorted[0];
              return best ? (
                <div className="col-span-2 flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/60">Meilleur score</p>
                    <p className="text-2xl font-black text-amber-300">{best.score}</p>
                    <p className="text-xs font-bold text-white/60">{best.username ?? "Joueur"}</p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          {/* All players */}
          <div className={`grid gap-2 ${royalePlayers.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
            {[...royalePlayers]
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .map((player, i) => {
                const isWinner = royaleGameOver && royaleWinner?.id === player.id;
                const isNewlyEliminated = player.eliminatedRound === currentRound;
                return (
                  <RoyalePlayerCard
                    key={player.id}
                    player={player}
                    imageUrl={royaleImages[player.id] ?? null}
                    isWinner={isWinner}
                    isNewlyEliminated={isNewlyEliminated}
                    delay={i * 150}
                  />
                );
              })}
          </div>
        </div>
      ) : (
        /* ── Duel / Ranked: 3 colonnes référence + 2 joueurs ── */
        <div className="grid grid-cols-3 gap-2">
          <ReferenceCard pose={pose} />
          <PlayerCard
            label={r.player1_username ?? (isHost ? "Toi" : "Joueur 1")}
            avatar={r.player1_avatar ?? DEFAULT_AVATAR}
            imageUrl={r.player1_image_url ?? null}
            score={p1Score}
            roast={r.player1_roast ?? null}
            isWinner={p1Wins}
            delay={300}
          />
          <PlayerCard
            label={r.player2_username ?? (!isHost ? "Toi" : "Joueur 2")}
            avatar={r.player2_avatar ?? DEFAULT_AVATAR}
            imageUrl={r.player2_image_url ?? null}
            score={p2Score}
            roast={r.player2_roast ?? null}
            isWinner={p2Wins}
            delay={600}
          />
        </div>
      )}

      <div className="flex-1" />

      {isRanked && !rankedMatchDone ? (
        isHost ? (
          <button
            className="min-h-[44px] w-full rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-50"
            onClick={handleNextRankedRound}
            disabled={advancing}
          >
            {advancing ? "Chargement…" : "Round suivant"}
          </button>
        ) : (
          <p className="text-center text-sm text-white/40">En attente de l&apos;hôte pour le round suivant…</p>
        )
      ) : isRoyale && !royaleGameOver ? (
        isHost ? (
          <button
            className="min-h-[44px] w-full rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98] disabled:opacity-50"
            onClick={handleNextRoyaleRound}
            disabled={advancing}
          >
            {advancing ? "Chargement…" : `Round suivant (${royaleActive.length} joueurs)`}
          </button>
        ) : (
          <p className="text-center text-sm text-white/40">En attente de l&apos;hôte pour le round suivant…</p>
        )
      ) : (
        <button
          className="min-h-[44px] w-full rounded-[14px] bg-primary px-5 py-4 text-lg font-bold shadow-glow active:scale-[0.98]"
          onClick={() => router.push(isRanked ? "/lobby?mode=ranked" : isRoyale ? "/lobby?mode=royale" : "/lobby")}
        >
          Rejouer
        </button>
      )}
    </main>
  );
}

// ── ReferenceCard ─────────────────────────────────────────────────────────────

function ReferenceCard({ pose }: { pose: Pose | null }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-glass">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink">
        {pose && !imgError ? (
          <Image
            src={pose.imageUrl}
            alt={pose.title}
            fill
            className="object-contain"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-ink" />
        )}
      </div>
      <div className="p-2 text-center bg-white/[0.02]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Référence</p>
      </div>
    </div>
  );
}

// ── PlayerCard ────────────────────────────────────────────────────────────────

function PlayerCard({
  label,
  avatar,
  imageUrl,
  score,
  roast,
  isWinner,
  delay,
}: {
  label: string;
  avatar: string;
  imageUrl: string | null;
  score: number;
  roast: string | null;
  isWinner: boolean;
  delay: number;
}) {
  const displayed = useCountUp(score, delay);
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className={[
        "flex flex-col overflow-hidden rounded-2xl border transition-all duration-500",
        isWinner
          ? "border-amber-400/50 bg-amber-400/10 scale-[1.02] shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10"
          : "border-surface-border bg-surface shadow-glass",
      ].join(" ")}
    >
      {isWinner && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-300 z-10" />}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Avatar avatar={avatar} size="lg" />
          </div>
        )}
        {isWinner && (
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-lg">
            👑
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-2.5 text-center bg-white/[0.02]">
        <p className="text-[11px] font-bold uppercase tracking-wider truncate text-white/60 leading-tight">{label}</p>
        <p className={`text-3xl font-black tabular-nums tracking-tight leading-none ${isWinner ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-white"}`}>
          {displayed}
        </p>
        {roast && (
          <p className="text-[9px] font-medium italic leading-tight text-white/40 px-1">{roast}</p>
        )}
      </div>
    </div>
  );
}

// ── RoyalePlayerCard ──────────────────────────────────────────────────────────

function RoyalePlayerCard({
  player,
  imageUrl,
  isWinner,
  isNewlyEliminated,
  delay,
}: {
  player: import("@/lib/game").RoyalePlayer;
  imageUrl: string | null;
  isWinner: boolean;
  isNewlyEliminated: boolean;
  delay: number;
}) {
  const [imgError, setImgError] = useState(false);
  const displayed = useCountUp(player.score ?? 0, delay);

  const borderClass = isWinner
    ? "border-amber-400/50 bg-amber-400/10 scale-[1.03] shadow-[0_0_30px_rgba(251,191,36,0.15)] z-10"
    : isNewlyEliminated
      ? "border-red-500/40 bg-red-500/10 opacity-70"
      : player.eliminated
        ? "border-surface-border bg-surface opacity-40"
        : "border-surface-border bg-surface shadow-glass";

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-500 ${borderClass}`}>
      {/* Status badge */}
      {isWinner && (
        <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-lg">🏆</div>
      )}
      {isNewlyEliminated && (
        <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs shadow-lg">💀</div>
      )}
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={player.username ?? "Joueur"}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Avatar avatar={player.avatar ?? DEFAULT_AVATAR} size="lg" />
          </div>
        )}
      </div>
      {/* Score */}
      <div className="space-y-1 p-2 text-center bg-white/[0.02]">
        <p className="text-[10px] font-bold uppercase tracking-wider truncate text-white/50 leading-tight">
          {player.username ?? "Joueur"}
        </p>
        <p className={`text-2xl font-black tabular-nums leading-none ${isWinner ? "text-amber-400" : isNewlyEliminated ? "text-red-400" : "text-white"}`}>
          {player.eliminated && !isNewlyEliminated ? "—" : displayed}
        </p>
        {player.roast && (
          <p className="text-[8px] italic leading-tight text-white/35 px-0.5">{player.roast}</p>
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
