import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scorePractice } from "@/lib/scoring";

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
  const body = (await request.json()) as { poseId?: string; playerBase64?: string };

  if (!body.poseId || !body.playerBase64) {
    return NextResponse.json({ error: "poseId et playerBase64 requis." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: poseData } = await supabase
    .from("poses")
    .select("image_url")
    .eq("id", body.poseId)
    .single();

  if (!poseData) {
    return NextResponse.json({ error: "Pose introuvable." }, { status: 404 });
  }

  const refB64 = await fetchBase64(poseData.image_url as string);
  const result = await scorePractice(refB64 ?? "", body.playerBase64);
  return NextResponse.json(result);
}
