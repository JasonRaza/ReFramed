import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameMode, GameState, Pose, Profile, Room, RoyalePlayer } from "./game";

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

function mapPose(row: Record<string, any>): Pose {
  return {
    id: row.id as string,
    title: row.title as string,
    artist: row.artist as string,
    category: row.category as Pose["category"],
    difficulty: row.difficulty as 1 | 2 | 3 | 4 | 5,
    imageUrl: row.image_url as string,
  };
}

function toRoyalePlayer(playerId: string, profile?: Profile | null): RoyalePlayer {
  return {
    id: playerId,
    username: profile?.username ?? null,
    avatar: profile?.avatar ?? null,
    joinedAt: new Date().toISOString(),
  };
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function createRoom(
  playerId: string,
  profile?: Profile | null,
  mode: GameMode = "duel",
): Promise<{ room: Room; code: string } | null> {
  if (!supabase) return null;

  const code = generateRoomCode();
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      code,
      state: "LOBBY",
      mode,
      player1_id: playerId,
      player1_username: profile?.username ?? null,
      player1_avatar: profile?.avatar ?? null,
      ...(mode === "royale"
        ? {
            max_players: 8,
            royale_players: [toRoyalePlayer(playerId, profile)],
          }
        : {}),
    })
    .select()
    .single();

  if (error || !data) return null;
  return { room: data as Room, code };
}

export async function joinRoom(
  code: string,
  playerId: string,
  profile?: Profile | null,
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

  if (existingRoom.mode === "royale") {
    const currentPlayers = Array.isArray(existingRoom.royale_players)
      ? existingRoom.royale_players
      : [];
    const alreadyInRoyale = currentPlayers.some((player) => player.id === playerId);
    const maxPlayers = existingRoom.max_players ?? 8;

    if (!alreadyInRoyale && currentPlayers.length >= maxPlayers) return null;

    const nextPlayers = alreadyInRoyale
      ? currentPlayers
      : [...currentPlayers, toRoyalePlayer(playerId, profile)];

    const { data, error } = await supabase
      .from("rooms")
      .update({
        royale_players: nextPlayers,
        ...(!existingRoom.player2_id
          ? {
              player2_id: playerId,
              player2_username: profile?.username ?? null,
              player2_avatar: profile?.avatar ?? null,
            }
          : {}),
      })
      .eq("id", existingRoom.id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Room;
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({
      player2_id: playerId,
      player2_username: profile?.username ?? null,
      player2_avatar: profile?.avatar ?? null,
    })
    .eq("id", existingRoom.id)
    .select()
    .single();

  if (error || !data) return null;
  return data as Room;
}

export async function fetchRoom(roomId: string): Promise<Room | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
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
    .update({ state, preview_started_at: new Date().toISOString(), ...extra })
    .eq("id", roomId)
    .select()
    .single();

  if (error || !data) {
    console.error("updateRoomState failed:", error?.message, error?.details);
    return null;
  }
  return data as Room;
}

export async function fetchPoseById(poseId: string): Promise<Pose | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("poses")
    .select("*")
    .eq("id", poseId)
    .single();
  if (error || !data) return null;
  return mapPose(data);
}

export async function fetchRandomPose(filter?: {
  category?: string;
  minDifficulty?: number;
}): Promise<Pose | null> {
  if (!supabase) return null;
  let query: any = supabase.from("poses").select("*");
  if (filter?.category) query = query.eq("category", filter.category);
  if (filter?.minDifficulty) query = query.gte("difficulty", filter.minDifficulty);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return mapPose(data[Math.floor(Math.random() * data.length)] as Record<string, any>);
}

/** Saves a royale player's captured image URL atomically (safe for concurrent uploads). */
export async function saveRoyalePlayerImage(
  roomId: string,
  playerId: string,
  imageUrl: string,
): Promise<void> {
  if (!supabase) return;
  await (supabase as any).rpc("merge_royale_player_image", {
    p_room_id: roomId,
    p_player_id: playerId,
    p_image_url: imageUrl,
  });
}

/** Picks a random pose from the DB and transitions the room to PREVIEW. */
export async function startGame(roomId: string): Promise<Room | null> {
  const pose = await fetchRandomPose();
  if (!pose) return null;
  return updateRoomState(roomId, "PREVIEW", {
    current_pose_id: pose.id,
    player1_image_url: null,
    player2_image_url: null,
    player1_score: null,
    player2_score: null,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
  });
}

/** Starts a Battle Royale game: picks a pose and enters PREVIEW. Clears previous round data. */
export async function startRoyaleGame(roomId: string): Promise<Room | null> {
  const pose = await fetchRandomPose();
  if (!pose) return null;
  return updateRoomState(roomId, "PREVIEW", {
    current_pose_id: pose.id,
    current_round: 1,
    player1_image_url: null,
    player2_image_url: null,
    player1_score: null,
    player2_score: null,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
    royale_player_images: {},
  });
}

/** Starts next royale round: new pose, clears per-round data, scores stay on players. */
export async function startNextRoyaleRound(room: Room): Promise<Room | null> {
  const pose = await fetchRandomPose();
  if (!pose) return null;

  // Clear per-round fields on each player but keep eliminated/eliminatedRound
  const clearedPlayers = (room.royale_players ?? []).map((p) => ({
    ...p,
    score: null,
    roast: null,
  }));

  return updateRoomState(room.id, "PREVIEW", {
    current_pose_id: pose.id,
    current_round: (room.current_round ?? 1) + 1,
    player1_image_url: null,
    player2_image_url: null,
    player1_score: null,
    player2_score: null,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
    royale_players: clearedPlayers,
    royale_player_images: {},
  });
}

export async function startRankedGame(roomId: string): Promise<Room | null> {
  const pose = await fetchRandomPose();
  if (!pose) return null;
  return updateRoomState(roomId, "PREVIEW", {
    current_pose_id: pose.id,
    current_round: 1,
    total_rounds: 5,
    ranked_player1_rounds: 0,
    ranked_player2_rounds: 0,
    player1_image_url: null,
    player2_image_url: null,
    player1_score: null,
    player2_score: null,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
  });
}

export async function startNextRankedRound(room: Room): Promise<Room | null> {
  const nextRound = room.current_round + 1;
  if (nextRound > (room.total_rounds ?? 5)) {
    return updateRoomState(room.id, "RESULTS");
  }

  const pose = await fetchRandomPose();
  if (!pose) return null;

  return updateRoomState(room.id, "PREVIEW", {
    current_pose_id: pose.id,
    current_round: nextRound,
    player1_image_url: null,
    player2_image_url: null,
    player1_score: null,
    player2_score: null,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
  });
}

/** Starts a mirror mode game: sets state to MIRROR_POSE, picks P1 as first poser. */
export async function startMirrorGame(roomId: string): Promise<Room | null> {
  return updateRoomState(roomId, "MIRROR_POSE", {
    current_poser: "player1",
    current_round: 1,
    total_rounds: 2,
    mirror_ref_url: null,
    mirror_copy_url: null,
    player1_score: 0,
    player2_score: 0,
    player1_roast: null,
    player2_roast: null,
    winner: null,
    scored: false,
  });
}

/** Upload a mirror image (ref or copy) to the player-images bucket and return its public URL. */
export async function uploadMirrorImage(
  roomId: string,
  slot: "ref" | "copy",
  base64DataUrl: string,
): Promise<string | null> {
  if (!supabase) return null;
  const blob = dataUrlToBlob(base64DataUrl);
  const path = `mirror/${roomId}/${slot}_${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("player-images")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("player-images").getPublicUrl(path);
  return data.publicUrl;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** After poser uploads, save ref URL and transition to MIRROR_COPY. */
export async function saveMirrorRefUrl(
  roomId: string,
  url: string,
): Promise<Room | null> {
  return updateRoomState(roomId, "MIRROR_COPY", { mirror_ref_url: url });
}

/** After imitator uploads, save copy URL — stays in MIRROR_COPY until host triggers scoring. */
export async function saveMirrorCopyUrl(
  roomId: string,
  url: string,
): Promise<Room | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rooms")
    .update({ mirror_copy_url: url })
    .eq("id", roomId)
    .select()
    .single();
  if (error || !data) return null;
  return data as Room;
}

/**
 * Advance to next round or finish.
 * If rounds remain: flip poser, clear URLs, go to MIRROR_POSE.
 * If last round: go to RESULTS (scores already written by score-mirror API).
 */
export async function nextMirrorRound(room: Room): Promise<Room | null> {
  const nextRound = room.current_round + 1;
  if (nextRound > room.total_rounds) {
    return updateRoomState(room.id, "RESULTS");
  }
  const nextPoser = room.current_poser === "player1" ? "player2" : "player1";
  return updateRoomState(room.id, "MIRROR_POSE", {
    current_round: nextRound,
    current_poser: nextPoser,
    mirror_ref_url: null,
    mirror_copy_url: null,
    scored: false,
  });
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
