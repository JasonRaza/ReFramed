"use client";

import { useEffect, useReducer } from "react";
import { supabase } from "./supabase";
import type { Profile } from "./game";

// ── In-memory state (source of truth) ────────────────────────────────────────

let _userId:     string | null = null;
let _profile:    Profile       = { username: "Joueur", avatar: "🐺|violet" };
let _rankPoints: number        = 1000;
let _games:      number        = 0;
let _wins:       number        = 0;
let _best:       number        = 0;
let _ready:      boolean       = false;

// ── Pub/sub for reactive updates ──────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeStore(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ── Sync readers ──────────────────────────────────────────────────────────────

export const storeReady    = (): boolean       => _ready;
export const getUserId     = (): string | null => _userId;
export const getProfile    = (): Profile       => ({ ..._profile });
export const getRankPoints = (): number        => _rankPoints;
export const getStats      = () => ({ games: _games, wins: _wins, best: _best });

// ── Init: load everything from DB ────────────────────────────────────────────

export async function initUserStore(): Promise<void> {
  if (!supabase || typeof window === "undefined") {
    _ready = true;
    notify();
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  _userId = sessionData.session?.user?.id ?? null;

  if (_userId) {
    const { data } = await supabase
      .from("user_profiles")
      .select("username, avatar, rank_points, games_played, wins, best_score")
      .eq("id", _userId)
      .single();

    if (data) {
      _profile    = { username: data.username as string, avatar: data.avatar as string };
      _rankPoints = typeof data.rank_points  === "number" ? data.rank_points  : 1000;
      _games      = typeof data.games_played === "number" ? data.games_played : 0;
      _wins       = typeof data.wins         === "number" ? data.wins         : 0;
      _best       = typeof data.best_score   === "number" ? data.best_score   : 0;
    }
  }

  _ready = true;
  notify();
}

// ── Reset on sign-out ────────────────────────────────────────────────────────

export function clearStore(): void {
  _userId     = null;
  _profile    = { username: "Joueur", avatar: "🐺|violet" };
  _rankPoints = 1000;
  _games      = 0;
  _wins       = 0;
  _best       = 0;
  _ready      = false;
  notify();
}

// ── Write helpers — always write to DB first ──────────────────────────────────

export async function saveProfile(profile: Profile): Promise<void> {
  _profile = { ...profile };
  notify();
  if (!supabase || !_userId) return;
  await supabase.from("user_profiles").upsert({
    id:       _userId,
    username: profile.username,
    avatar:   profile.avatar,
  });
}

// Idempotency guards stored in localStorage — only contain room IDs, not game data
const RANK_APPLIED_KEY  = "reframed_rank_applied_rooms";
const STATS_APPLIED_KEY = "reframed_stats_applied_rooms";

function getApplied(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as string[]; } catch { return []; }
}
function setApplied(key: string, rooms: string[]): void {
  localStorage.setItem(key, JSON.stringify(rooms.slice(-50)));
}

/** Apply a rank delta once per room. Writes to DB immediately. */
export async function applyRankDelta(roomId: string, delta: number): Promise<number> {
  const applied = getApplied(RANK_APPLIED_KEY);
  if (applied.includes(roomId)) return _rankPoints;

  _rankPoints = Math.max(0, _rankPoints + delta);
  notify();

  if (supabase && _userId) {
    await supabase
      .from("user_profiles")
      .update({ rank_points: _rankPoints })
      .eq("id", _userId);
  }

  setApplied(RANK_APPLIED_KEY, [...applied, roomId]);
  return _rankPoints;
}

/** Save a game result once per room. Writes to DB via RPC. */
export async function saveGameResult(
  roomId: string,
  result: "win" | "loss" | "draw",
  score:  number,
): Promise<void> {
  if (!supabase || !_userId) return;

  const applied = getApplied(STATS_APPLIED_KEY);
  if (applied.includes(roomId)) return;

  _games += 1;
  if (result === "win") _wins += 1;
  if (score > _best)    _best  = score;
  notify();

  await supabase.rpc("record_game_result", { p_won: result === "win", p_score: score });

  setApplied(STATS_APPLIED_KEY, [...applied, roomId]);
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useUserStore() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => subscribeStore(rerender), []);

  return {
    ready:      _ready,
    userId:     _userId,
    profile:    _profile,
    rankPoints: _rankPoints,
    games:      _games,
    wins:       _wins,
    best:       _best,
  };
}
