"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, subscribeToRoom } from "@/lib/supabase";
import { STATE_ROUTE } from "@/lib/game";
import type { GameState, Room } from "@/lib/game";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("reframed_player_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("reframed_player_id", id);
  }
  return id;
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
