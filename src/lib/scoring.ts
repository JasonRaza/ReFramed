import Anthropic from "@anthropic-ai/sdk";
import type { PracticeResult, ScoreResult } from "./game";

const MODEL = "claude-sonnet-4-6";

// ─── Shared scoring criteria (injected into both prompts) ────────────────────

const BODY_CRITERIA = `
IGNORE COMPLETELY — do not let these influence the score:
- Clothing, costume, outfit, colors, patterns
- Background, setting, environment, props, furniture
- Skin tone, body type, age, gender, face, hair
- Lighting, image quality, camera angle, resolution
- Any objects being held (unless they define the pose shape)

SCORE ONLY body geometry — how closely the limb positions match:
- Overall silhouette shape (20 pts): does the body outline match?
- Arms: angle, height, elbow bend, wrist orientation (25 pts)
- Legs: stance width, knee bend, foot placement, hip angle (25 pts)
- Torso: forward/back lean, lateral lean, rotation/twist (20 pts)
- Head and neck: tilt direction, turn angle (10 pts)

Scoring scale:
- 90–100: Near-perfect — every limb within ~15° of reference
- 70–89:  Good — most limbs correct, 1–2 minor deviations
- 50–69:  Partial — right idea, 1–2 body parts significantly off
- 30–49:  Weak — only the rough overall shape matches
- 0–29:   Wrong — fundamentally different body geometry`;

// ─── 1v1 judge prompt ────────────────────────────────────────────────────────

const DUEL_PROMPT = `You are a strict body-geometry judge for a 1v1 pose imitation game.

You receive 3 images:
- Image 1: the reference pose to replicate
- Image 2: Player 1's attempt
- Image 3: Player 2's attempt
${BODY_CRITERIA}

Compare each player independently against the reference (not against each other).
Write one roast per player in French (max 10 words): savage, funny, and specific — name the exact body part that is wrong.

Return ONLY valid JSON, no markdown, no explanation:
{"player1Score":number,"player2Score":number,"player1Roast":"string","player2Roast":"string","winner":"player1"|"player2"|"tie"}`;

// ─── Solo practice prompt ────────────────────────────────────────────────────

const PRACTICE_PROMPT = `You are a strict body-geometry coach for a solo pose training game.

You receive 2 images:
- Image 1: the reference pose to replicate
- Image 2: the player's attempt
${BODY_CRITERIA}

Write one coaching roast in French (max 12 words): funny and specific — name exactly which body part needs fixing and how.

Return ONLY valid JSON, no markdown, no explanation:
{"score":number,"roast":"string"}`;

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const DUEL_FALLBACK: ScoreResult = {
  player1Score: 50,
  player2Score: 50,
  player1Roast: "L'IA a rendu les armes.",
  player2Roast: "Trop fort pour être jugé.",
  winner: "tie",
};

const PRACTICE_FALLBACK: PracticeResult = {
  score: 50,
  roast: "L'IA juge pas, mais t'as essayé — c'est déjà ça.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function img(data: string) {
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Strips markdown code fences that Claude sometimes wraps around JSON. */
function parseJson<T>(raw: string): T {
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(clean) as T;
}

export async function scoreRound(
  referenceBase64: string,
  player1Base64: string,
  player2Base64: string,
): Promise<ScoreResult> {
  const anthropic = makeClient();
  if (!anthropic) {
    console.error("[scoring] ANTHROPIC_API_KEY manquant — fallback 50/50");
    return DUEL_FALLBACK;
  }

  if (!referenceBase64) {
    console.error("[scoring] Image de référence vide — impossible de scorer");
    return DUEL_FALLBACK;
  }

  async function attempt(): Promise<ScoreResult> {
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: DUEL_PROMPT,
      messages: [{
        role: "user",
        content: [img(referenceBase64), img(player1Base64), img(player2Base64)],
      }],
    });
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("réponse vide de Claude");
    return parseJson<ScoreResult>(text);
  }

  try {
    return await attempt();
  } catch (e1) {
    console.error("[scoring] attempt 1 échouée:", e1);
    try {
      return await attempt();
    } catch (e2) {
      console.error("[scoring] attempt 2 échouée:", e2);
      return DUEL_FALLBACK;
    }
  }
}

export async function scorePractice(
  referenceBase64: string,
  playerBase64: string,
): Promise<PracticeResult> {
  const anthropic = makeClient();
  if (!anthropic) {
    console.error("[scoring] ANTHROPIC_API_KEY manquant — fallback practice");
    return PRACTICE_FALLBACK;
  }

  async function attempt(): Promise<PracticeResult> {
    const response = await anthropic!.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: PRACTICE_PROMPT,
      messages: [{
        role: "user",
        content: [img(referenceBase64), img(playerBase64)],
      }],
    });
    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("réponse vide de Claude");
    return parseJson<PracticeResult>(text);
  }

  try {
    return await attempt();
  } catch (e1) {
    console.error("[scoring] practice attempt 1 échouée:", e1);
    try {
      return await attempt();
    } catch (e2) {
      console.error("[scoring] practice attempt 2 échouée:", e2);
      return PRACTICE_FALLBACK;
    }
  }
}
