import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scorePractice } from "@/lib/scoring";
import type { Room } from "@/lib/game";

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { "User-Agent": "ReFramed-Game/1.0" },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()).toString("base64");
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

  const room = roomData as Room & {
    mirror_ref_url: string | null;
    mirror_copy_url: string | null;
    current_poser: "player1" | "player2" | null;
    current_round: number;
    total_rounds: number;
  };

  if (room.state !== "MIRROR_SCORING") {
    return NextResponse.json({ error: "Pas en phase de scoring miroir." }, { status: 400 });
  }

  if (room.scored) {
    return NextResponse.json({ message: "Round miroir déjà scoré." });
  }

  if (!room.mirror_ref_url || !room.mirror_copy_url) {
    return NextResponse.json({ error: "Images manquantes." }, { status: 400 });
  }

  const [refB64, copyB64] = await Promise.all([
    fetchBase64(room.mirror_ref_url),
    fetchBase64(room.mirror_copy_url),
  ]);

  const result = await scorePractice(refB64 ?? "", copyB64 ?? "");

  // Determine which slot the imitator occupies
  const imitatorSlot = room.current_poser === "player1" ? "player2" : "player1";
  const scoreField = `${imitatorSlot}_score` as "player1_score" | "player2_score";
  const roastField = `${imitatorSlot}_roast` as "player1_roast" | "player2_roast";

  const isLastRound = room.current_round >= room.total_rounds;

  // Accumulate score (add to any existing score from previous rounds)
  const previousScore = (room[scoreField] ?? 0) as number;
  const newScore = previousScore + result.score;

  // Determine winner if final round
  let winner: string | null = null;
  if (isLastRound) {
    // The other slot's score (poser this round, imitator last round)
    const otherSlot = imitatorSlot === "player1" ? "player2" : "player1";
    const otherScore = (room[`${otherSlot}_score` as "player1_score"] ?? 0) as number;
    if (newScore > otherScore) winner = imitatorSlot;
    else if (otherScore > newScore) winner = otherSlot;
    else winner = "tie";
  }

  const nextState = isLastRound ? "RESULTS" : "MIRROR_ROUND";

  await supabase.from("rooms").update({
    [scoreField]: newScore,
    [roastField]: result.roast,
    ...(isLastRound ? { winner } : {}),
    scored: true,
    state: nextState,
    preview_started_at: new Date().toISOString(),
  }).eq("id", body.roomId);

  return NextResponse.json({ score: newScore, roast: result.roast, winner });
}
