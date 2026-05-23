import { supabase } from "./supabase";
import type { Room } from "./game";

function base64ToBlob(base64: string): Blob {
  const stripped = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const bytes = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}

/**
 * Upload a player's captured photo to Supabase Storage.
 * Returns the public URL, or null on failure (retries once).
 */
export async function uploadPlayerImage(
  roomId: string,
  playerId: string,
  base64: string,
): Promise<string | null> {
  if (!supabase) return null;

  const blob = base64ToBlob(base64);
  const path = `${roomId}/${playerId}.jpg`;
  const opts = { upsert: true, contentType: "image/jpeg" } as const;

  let { error } = await supabase.storage.from("player-images").upload(path, blob, opts);

  if (error) {
    // Retry once
    const { error: retryErr } = await supabase.storage.from("player-images").upload(path, blob, opts);
    if (retryErr) return null;
  }

  const { data } = supabase.storage.from("player-images").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Write the player's image URL into the correct room column
 * (player1_image_url or player2_image_url) based on who is who.
 */
export async function savePlayerImageUrl(
  roomId: string,
  playerId: string,
  imageUrl: string,
): Promise<Room | null> {
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("rooms")
    .select("player1_id")
    .eq("id", roomId)
    .single();

  if (!existing) return null;

  const field =
    existing.player1_id === playerId ? "player1_image_url" : "player2_image_url";

  const { data, error } = await supabase
    .from("rooms")
    .update({ [field]: imageUrl })
    .eq("id", roomId)
    .select()
    .single();

  if (error || !data) return null;
  return data as Room;
}
