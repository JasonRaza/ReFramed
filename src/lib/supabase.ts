import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameState, Pose, Room } from "./game";
import poses from "./poses.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Untyped client — explicit return types on each function keep safety local.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── helpers ────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function pickRandomPose(): string {
  return (poses as Pose[])[Math.floor(Math.random() * poses.length)].id;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function createRoom(
  playerId: string,
): Promise<{ room: Room; code: string } | null> {
  if (!supabase) return null;

  const code = generateRoomCode();
  const { data, error } = await supabase
    .from("rooms")
    .insert({ code, state: "LOBBY", player1_id: playerId })
    .select()
    .single();

  if (error || !data) return null;
  return { room: data as Room, code };
}

export async function joinRoom(
  code: string,
  playerId: string,
): Promise<Room | null> {
  if (!supabase) return null;

  const { data: existing, error: fetchErr } = await supabase
    .from("rooms")
    .select()
    .eq("code", code.toUpperCase())
    .single();

  if (fetchErr || !existing) return null;
  const existingRoom = existing as Room;

  // Already in room as player 1 — return as-is
  if (existingRoom.player1_id === playerId) return existingRoom;

  const { data, error } = await supabase
    .from("rooms")
    .update({ player2_id: playerId })
    .eq("id", existingRoom.id)
    .select()
    .single();

  if (error || !data) return null;
  return data as Room;
}

export async function updateRoomState(
  roomId: string,
  state: GameState,
  extra: Partial<Room> = {},
): Promise<Room | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("rooms")
    .update({ state, phase_started_at: new Date().toISOString(), ...extra })
    .eq("id", roomId)
    .select()
    .single();

  if (error || !data) return null;
  return data as Room;
}

/** Picks a random pose and transitions the room to PREVIEW. */
export async function startGame(roomId: string): Promise<Room | null> {
  return updateRoomState(roomId, "PREVIEW", { current_pose_id: pickRandomPose() });
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void,
): RealtimeChannel {
  const channel = supabase!
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => callback(payload.new as Room),
    )
    .subscribe();

  return channel;
}
