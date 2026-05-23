export const GAME_STATES = [
  "LOBBY",
  "PREVIEW",
  "POSE",
  "CAPTURE",
  "SCORING",
  "RESULTS",
] as const;

export type GameState = (typeof GAME_STATES)[number];

export const STATE_ROUTE: Record<GameState, string> = {
  LOBBY: "/lobby",
  PREVIEW: "/preview",
  POSE: "/pose",
  CAPTURE: "/capture",
  SCORING: "/scoring",
  RESULTS: "/results",
};

export type Room = {
  id: string;
  code: string;
  state: GameState;
  current_pose_id: string | null;
  player1_id: string | null;
  player2_id: string | null;
  player1_image_url: string | null;
  player2_image_url: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner: string | null;
  phase_started_at: string | null;
  created_at: string;
};

export type Pose = {
  id: string;
  title: string;
  artist: string;
  category: "sculpture" | "cinema" | "sport" | "peinture";
  difficulty: 1 | 2 | 3 | 4 | 5;
  imageUrl: string;
};

export type ScoreResult = {
  playerScore: number;
  opponentScore: number;
  winner: "player" | "opponent" | "draw";
  roast: string;
};
