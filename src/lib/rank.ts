"use client";

import { getRankPoints, applyRankDelta } from "./userStore";

export type RankSnapshot = {
  points:    number;
  label:     string;
  nextLabel: string | null;
  progress:  number;
};

const RANKS = [
  { label: "Bronze",  min: 0    },
  { label: "Argent",  min: 900  },
  { label: "Or",      min: 1100 },
  { label: "Platine", min: 1300 },
  { label: "Diamant", min: 1550 },
  { label: "Légende", min: 1850 },
];

export function rankSnapshotFromPoints(points: number): RankSnapshot {
  const current   = [...RANKS].reverse().find((r) => points >= r.min) ?? RANKS[0];
  const next      = RANKS.find((r) => r.min > points) ?? null;
  const prevMin   = current.min;
  const nextMin   = next?.min ?? Math.max(points, current.min + 1);
  const progress  = next ? (points - prevMin) / (nextMin - prevMin) : 1;
  return {
    points,
    label:     current.label,
    nextLabel: next?.label ?? null,
    progress:  Math.max(0, Math.min(1, progress)),
  };
}

/** Synchronous snapshot — reads from userStore (populated from DB on init). */
export function getRankSnapshot(): RankSnapshot {
  return rankSnapshotFromPoints(getRankPoints());
}

/** Apply a rank delta once per room and write to DB. Returns the new snapshot. */
export async function applyRankDeltaOnce(roomId: string, delta: number): Promise<RankSnapshot> {
  const points = await applyRankDelta(roomId, delta);
  return rankSnapshotFromPoints(points);
}

export function rankDeltaForResult(result: "win" | "loss" | "draw"): number {
  if (result === "win")  return  24;
  if (result === "loss") return -16;
  return 4;
}
