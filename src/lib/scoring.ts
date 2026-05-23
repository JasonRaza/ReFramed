import Anthropic from "@anthropic-ai/sdk";
import type { Pose, ScoreResult } from "./game";

const MODEL = "claude-sonnet-4-20250514";

export async function scoreAttempt({
  pose,
  playerImageBase64,
  opponentImageBase64,
}: {
  pose: Pose;
  playerImageBase64: string;
  opponentImageBase64: string;
}): Promise<ScoreResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      playerScore: 72,
      opponentScore: 68,
      winner: "player",
      roast: "Victoire par imitation approximative. Le musée tousse, mais il applaudit.",
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 350,
    temperature: 0.2,
    system:
      "Tu scores uniquement la ressemblance visuelle entre une pose originale et deux photos de joueurs. Réponds seulement en JSON valide.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Pose originale: ${pose.title}, ${pose.artist}. Note chaque joueur de 0 à 100 selon silhouette, angles, énergie et cadrage. Réponds avec {"playerScore":number,"opponentScore":number,"winner":"player"|"opponent"|"draw","roast":"phrase drôle en français"}.`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: playerImageBase64,
            },
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: opponentImageBase64,
            },
          },
        ],
      },
    ],
  });

  const text = response.content.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Claude n'a pas renvoyé de score.");
  }

  return JSON.parse(text) as ScoreResult;
}
