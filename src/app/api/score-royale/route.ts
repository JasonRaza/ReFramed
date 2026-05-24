import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scorePractice } from "@/lib/scoring";
import { fetchImageBase64 } from "@/lib/fetch-image";
import type { Room, RoyalePlayer } from "@/lib/game";

export async function POST(request: Request) {
  const body = (await request.json()) as { roomId?: string };

  if (!body.roomId) {
    return NextResponse.json({ error: "roomId requis." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: roomData, error: roomErr } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", body.roomId)
    .single();

  if (roomErr || !roomData) {
    return NextResponse.json({ error: "Salon introuvable." }, { status: 404 });
  }

  const room = roomData as Room;

  if (room.scored) return NextResponse.json({ message: "already scored" });
  if (room.state !== "SCORING") {
    return NextResponse.json({ error: "Pas en phase de scoring." }, { status: 400 });
  }

  // Fetch reference pose image
  const { data: poseData } = await supabase
    .from("poses")
    .select("image_url")
    .eq("id", room.current_pose_id)
    .single();

  if (!poseData) {
    return NextResponse.json({ error: "Pose introuvable." }, { status: 400 });
  }

  const refB64 = await fetchImageBase64(poseData.image_url as string);
  const images = (room.royale_player_images ?? {}) as Record<string, string>;

  // Active (non-eliminated) players only
  const activePlayers: RoyalePlayer[] = (room.royale_players ?? []).filter(
    (p) => !p.eliminated,
  );

  if (activePlayers.length === 0) {
    return NextResponse.json({ error: "Aucun joueur actif." }, { status: 400 });
  }

  // Score every active player in parallel
  const scored = await Promise.all(
    activePlayers.map(async (player) => {
      const imageUrl = images[player.id];
      if (!imageUrl) {
        return { ...player, score: 0, roast: "Photo manquante… éliminé !" };
      }
      const b64 = await fetchImageBase64(imageUrl);
      const result = await scorePractice(refB64 ?? "", b64 ?? "");
      return { ...player, score: result.score, roast: result.roast };
    }),
  );

  // Find the player to eliminate: lowest score, ties broken by latest joinedAt
  const minScore = Math.min(...scored.map((p) => p.score ?? 0));
  const losers = scored
    .filter((p) => (p.score ?? 0) === minScore)
    .sort(
      (a, b) =>
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
    );
  const toEliminate = losers[0];
  const currentRound = room.current_round ?? 1;

  // Rebuild the full royale_players array with updated scores + elimination
  const updatedPlayers: RoyalePlayer[] = (room.royale_players ?? []).map(
    (p) => {
      const scoredPlayer = scored.find((s) => s.id === p.id);
      if (!scoredPlayer) return p; // already-eliminated player — unchanged
      return {
        ...scoredPlayer,
        eliminated: p.eliminated || p.id === toEliminate.id,
        eliminatedRound: p.id === toEliminate.id ? currentRound : p.eliminatedRound ?? null,
      };
    },
  );

  // Check if game is over (1 active player left)
  const remaining = updatedPlayers.filter((p) => !p.eliminated);
  const gameOver = remaining.length <= 1;
  const winnerId = gameOver && remaining.length === 1 ? remaining[0].id : null;

  await supabase.from("rooms").update({
    royale_players: updatedPlayers,
    winner: winnerId,
    scored: true,
    state: "RESULTS",
    preview_started_at: new Date().toISOString(),
  }).eq("id", body.roomId);

  return NextResponse.json({
    eliminated: toEliminate.username ?? toEliminate.id,
    gameOver,
    winner: winnerId,
    scores: scored.map((p) => ({ id: p.id, score: p.score })),
  });
}
