"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { fetchPoseById, supabase, subscribeToRoom } from "@/lib/supabase";
import { STATE_ROUTE } from "@/lib/game";
import type { GameState, Pose, Profile, Room } from "@/lib/game";
import {
  getUserId,
  getProfile as storeGetProfile,
  saveProfile as storeSaveProfile,
} from "@/lib/userStore";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Returns the player ID for multiplayer rooms.
 * Uses the Supabase user ID for authenticated users,
 * falls back to a stable per-device UUID for guests.
 */
export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  const uid = getUserId();
  if (uid) return uid;
  // Guest fallback
  let id = localStorage.getItem("reframed_player_id");
  if (!id) {
    id = uuid();
    localStorage.setItem("reframed_player_id", id);
  }
  return id;
}

/** Returns the current user's profile from the store (populated from DB). */
export function getProfile(): Profile | null {
  const p = storeGetProfile();
  return p.username ? p : null;
}

/** Saves the profile to DB via the store. */
export function saveProfile(profile: Profile): void {
  void storeSaveProfile(profile);
}

/** Fetches a pose from the DB when a poseId is available. */
export function usePose(poseId: string | null | undefined): Pose | null {
  const [pose, setPose] = useState<Pose | null>(null);
  useEffect(() => {
    if (!poseId) { setPose(null); return; }
    fetchPoseById(poseId).then(setPose);
  }, [poseId]);
  return pose;
}

export function useGameRoom(roomId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setPlayerId(getPlayerId());
  }, []);

  useEffect(() => {
    if (!supabase || !roomId) return;

    supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr || !data) {
          setError("Salon introuvable.");
          setLoading(false);
          return;
        }
        const fetched = data as Room;
        setRoom(fetched);
        setLoading(false);

        const expected = STATE_ROUTE[fetched.state as GameState];
        if (expected && !pathname.startsWith(`${expected}/`)) {
          router.replace(`${expected}/${roomId}`);
        }
      });

    channelRef.current = subscribeToRoom(roomId, (updated) => {
      setRoom(updated);
      const expected = STATE_ROUTE[updated.state as GameState];
      if (expected && !pathname.startsWith(`${expected}/`)) {
        router.replace(`${expected}/${roomId}`);
      }
    });

    return () => {
      if (supabase && channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const isHost = Boolean(playerId && room && room.player1_id === playerId);

  return { room, loading, error, isHost, playerId };
}
