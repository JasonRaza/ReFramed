import Anthropic from "@anthropic-ai/sdk";
import type { ScoreResult } from "./game";

const MODEL = "claude-sonnet-4-6";

const JUDGE_PROMPT = `You are a funny but fair art judge for a pose imitation game.
You receive 3 images:
- Image 1: the reference pose to imitate
- Image 2: Player 1's attempt
- Image 3: Player 2's attempt

Score each player from 0 to 100 based on:
- Body silhouette and overall shape similarity (40 points)
- Key position accuracy: arms, legs, head angle (40 points)
- Framing and composition (20 points)

Write one roast per player: savage, funny, max 10 words in French.
Be creative with the roasts — reference the specific pose.

Return ONLY this valid JSON, no markdown, no explanation:
{"player1Score":number,"player2Score":number,"player1Roast":"string","player2Roast":"string","winner":"player1"|"player2"|"tie"}`;

const FALLBACK: ScoreResult = {
  player1Score: 50,
  player2Score: 50,
  player1Roast: "L'IA a rendu les armes.",
  player2Roast: "Trop fort pour être jugé.",
  winner: "tie",
};

export async function scoreRound(
  referenceBase64: string,
  player1Base64: string,
  player2Base64: string,
): Promise<ScoreResult> {
  if (!process.env.ANTHROPIC_API_KEY) return FALLBACK;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async function attempt(): Promise<ScoreResult> {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 350,
      system: JUDGE_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: referenceBase64 } },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: player1Base64 } },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: player2Base64 } },
          ],
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("empty response");
    return JSON.parse(text) as ScoreResult;
  }

  try {
    return await attempt();
  } catch {
    try {
      return await attempt();
    } catch {
      return FALLBACK;
    }
  }
}
