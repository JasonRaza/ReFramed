import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scoreRound } from "@/lib/scoring";
import poses from "@/lib/poses.json";
import type { Pose, Room } from "@/lib/game";

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
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

  const pose = (poses as Pose[]).find((p) => p.id === room.current_pose_id);
  if (!pose) {
    return NextResponse.json({ error: "Pose introuvable." }, { status: 400 });
  }

  // Fetch all three images in parallel
  const [refB64, p1B64, p2B64] = await Promise.all([
    fetchBase64(pose.imageUrl),
    fetchBase64(room.player1_image_url),
    fetchBase64(room.player2_image_url),
  ]);

  const result = await scoreRound(
    refB64 ?? "",
    p1B64 ?? "",
    p2B64 ?? "",
  );

  // Save results + transition to RESULTS atomically
  await supabase.from("rooms").update({
    player1_score: result.player1Score,
    player2_score: result.player2Score,
    player1_roast: result.player1Roast,
    player2_roast: result.player2Roast,
    winner: result.winner,
    scored: true,
    state: "RESULTS",
    phase_started_at: new Date().toISOString(),
  }).eq("id", body.roomId);

  return NextResponse.json(result);
}
