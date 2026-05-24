import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scoreRound } from "@/lib/scoring";
import type { Pose, Room } from "@/lib/game";

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { "User-Agent": "ReFramed-Game/1.0" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
}

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

  // Idempotency guard
  if (room.scored) {
    return NextResponse.json({ message: "already scored" });
  }

  if (room.state !== "SCORING") {
    return NextResponse.json({ error: "Pas en phase de scoring." }, { status: 400 });
  }

  if (!room.player1_image_url || !room.player2_image_url) {
    return NextResponse.json({ error: "Images manquantes." }, { status: 400 });
  }

  const { data: poseData } = await supabase
    .from("poses")
    .select("*")
    .eq("id", room.current_pose_id)
    .single();
  const pose = poseData ? ({ ...poseData, imageUrl: poseData.image_url } as Pose) : null;
  if (!pose) {
    return NextResponse.json({ error: "Pose introuvable." }, { status: 400 });
  }

  // Fetch all three images in parallel
  const [refB64, p1B64, p2B64] = await Promise.all([
    fetchBase64(pose.imageUrl),
    fetchBase64(room.player1_image_url),
    fetchBase64(room.player2_image_url),
  ]);

  if (!refB64) console.error("[score] ❌ Image référence non chargée:", pose.imageUrl);
  if (!p1B64) console.error("[score] ❌ Image joueur 1 non chargée:", room.player1_image_url);
  if (!p2B64) console.error("[score] ❌ Image joueur 2 non chargée:", room.player2_image_url);

  const result = await scoreRound(
    refB64 ?? "",
    p1B64 ?? "",
    p2B64 ?? "",
  );

  const isRanked = room.mode === "ranked";
  const rankedP1Rounds = room.ranked_player1_rounds ?? 0;
  const rankedP2Rounds = room.ranked_player2_rounds ?? 0;
  const nextRankedP1Rounds = isRanked && result.winner === "player1"
    ? rankedP1Rounds + 1
    : rankedP1Rounds;
  const nextRankedP2Rounds = isRanked && result.winner === "player2"
    ? rankedP2Rounds + 1
    : rankedP2Rounds;
  const totalRounds = room.total_rounds ?? (isRanked ? 5 : 1);
  const rankedMatchDone = isRanked && (
    nextRankedP1Rounds >= 3 ||
    nextRankedP2Rounds >= 3 ||
    (room.current_round ?? 1) >= totalRounds
  );
  const finalWinner = isRanked
    ? nextRankedP1Rounds === nextRankedP2Rounds
      ? "tie"
      : nextRankedP1Rounds > nextRankedP2Rounds
        ? "player1"
        : "player2"
    : result.winner;

  // Save results + transition to RESULTS atomically
  await supabase.from("rooms").update({
    player1_score: result.player1Score,
    player2_score: result.player2Score,
    player1_roast: result.player1Roast,
    player2_roast: result.player2Roast,
    winner: isRanked && rankedMatchDone ? finalWinner : result.winner,
    ...(isRanked
      ? {
          ranked_player1_rounds: nextRankedP1Rounds,
          ranked_player2_rounds: nextRankedP2Rounds,
          total_rounds: 5,
        }
      : {}),
    scored: true,
    state: "RESULTS",
    preview_started_at: new Date().toISOString(),
  }).eq("id", body.roomId);

  return NextResponse.json(result);
}
