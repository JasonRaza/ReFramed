import { supabase } from "./supabase";

function base64ToBlob(base64: string): Blob {
  const stripped = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const bytes = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}

export async function uploadPlayerImage(
  roomId: string,
  playerId: string,
  base64: string,
): Promise<string | null> {
  if (!supabase) return null;

  const blob = base64ToBlob(base64);
  // Unique path per capture to bust CDN cache across rounds
  const path = `${roomId}/${playerId}_${Date.now()}.jpg`;
  const opts = { upsert: false, contentType: "image/jpeg" } as const;

  let { error } = await supabase.storage.from("player-images").upload(path, blob, opts);

  if (error) {
    const { error: retryErr } = await supabase.storage.from("player-images").upload(path, blob, opts);
    if (retryErr) return null;
  }

  const { data } = supabase.storage.from("player-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function savePlayerImageUrl(
  roomId: string,
  playerId: string,
  imageUrl: string,
): Promise<void> {
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("rooms")
    .select("player1_id")
    .eq("id", roomId)
    .single();

  if (!existing) return;

  const field =
    (existing as { player1_id: string | null }).player1_id === playerId
      ? "player1_image_url"
      : "player2_image_url";

  await supabase.from("rooms").update({ [field]: imageUrl }).eq("id", roomId);
}
