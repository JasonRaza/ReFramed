import { NextResponse } from "next/server";
import poses from "@/lib/poses.json";
import { scoreAttempt } from "@/lib/scoring";
import type { Pose } from "@/lib/game";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    poseId?: string;
    playerImageBase64?: string;
    opponentImageBase64?: string;
  };

  const pose = (poses as Pose[]).find((item) => item.id === body.poseId);

  if (!pose || !body.playerImageBase64 || !body.opponentImageBase64) {
    return NextResponse.json(
      { error: "Pose ou images manquantes." },
      { status: 400 },
    );
  }

  const result = await scoreAttempt({
    pose,
    playerImageBase64: body.playerImageBase64,
    opponentImageBase64: body.opponentImageBase64,
  });

  return NextResponse.json(result);
}
