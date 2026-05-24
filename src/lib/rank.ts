"use client";

const RANK_KEY = "reframed_rank_points";
const APPLIED_KEY = "reframed_rank_applied_rooms";
const DEFAULT_POINTS = 1000;

export type RankSnapshot = {
  points: number;
  label: string;
  nextLabel: string | null;
  progress: number;
};

const RANKS = [
  { label: "Bronze", min: 0 },
  { label: "Argent", min: 900 },
  { label: "Or", min: 1100 },
  { label: "Platine", min: 1300 },
  { label: "Diamant", min: 1550 },
  { label: "Légende", min: 1850 },
];

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function appliedRooms(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(APPLIED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveAppliedRooms(rooms: Set<string>) {
  localStorage.setItem(APPLIED_KEY, JSON.stringify(Array.from(rooms).slice(-50)));
}

export function getRankSnapshot(): RankSnapshot {
  const points = readNumber(RANK_KEY, DEFAULT_POINTS);
  const current = [...RANKS].reverse().find((rank) => points >= rank.min) ?? RANKS[0];
  const next = RANKS.find((rank) => rank.min > points) ?? null;
  const previousMin = current.min;
  const nextMin = next?.min ?? Math.max(points, current.min + 1);
  const progress = next ? (points - previousMin) / (nextMin - previousMin) : 1;

  return {
    points,
    label: current.label,
    nextLabel: next?.label ?? null,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

export function applyRankDeltaOnce(roomId: string, delta: number): RankSnapshot {
  if (typeof window === "undefined") return getRankSnapshot();
  const rooms = appliedRooms();
  if (!rooms.has(roomId)) {
    const nextPoints = Math.max(0, readNumber(RANK_KEY, DEFAULT_POINTS) + delta);
    localStorage.setItem(RANK_KEY, String(nextPoints));
    rooms.add(roomId);
    saveAppliedRooms(rooms);
  }
  return getRankSnapshot();
}

export function rankDeltaForResult(result: "win" | "loss" | "draw"): number {
  if (result === "win") return 24;
  if (result === "loss") return -16;
  return 4;
}

