export const GAME_STATES = [
  "LOBBY",
  "PREVIEW",
  "POSE",
  "CAPTURE",
  "SCORING",
  "RESULTS",
  "MIRROR_POSE",
  "MIRROR_COPY",
  "MIRROR_SCORING",
  "MIRROR_ROUND",
] as const;

export type GameState = (typeof GAME_STATES)[number];

export const STATE_ROUTE: Record<GameState, string> = {
  LOBBY: "/lobby",
  PREVIEW: "/preview",
  POSE: "/pose",
  CAPTURE: "/pose",
  SCORING: "/scoring",
  RESULTS: "/results",
  MIRROR_POSE: "/mirror-pose",
  MIRROR_COPY: "/mirror-copy",
  MIRROR_SCORING: "/mirror-scoring",
  MIRROR_ROUND: "/mirror-round",
};

export type GameMode = "duel" | "practice" | "royale" | "mirror" | "ranked";

export type Profile = {
  username: string;
  avatar: string; // "🐺|violet"
};

export type RoyalePlayer = {
  id: string;
  username: string | null;
  avatar: string | null;
  joinedAt: string;
  // Per-round scoring (filled by /api/score-royale)
  score?: number | null;
  roast?: string | null;
  // Elimination state
  eliminated?: boolean;
  eliminatedRound?: number | null;
};

export type Room = {
  id: string;
  code: string;
  state: GameState;
  mode: GameMode;
  current_pose_id: string | null;
  player1_id: string | null;
  player1_username: string | null;
  player1_avatar: string | null;
  player2_id: string | null;
  player2_username: string | null;
  player2_avatar: string | null;
  player1_image_url: string | null;
  player2_image_url: string | null;
  player1_score: number | null;
  player2_score: number | null;
  player1_roast: string | null;
  player2_roast: string | null;
  winner: string | null;
  scored: boolean;
  preview_started_at: string | null;
  created_at: string;
  // Mirror mode fields
  current_poser: "player1" | "player2" | null;
  mirror_ref_url: string | null;
  mirror_copy_url: string | null;
  current_round: number;
  total_rounds: number;
  ranked_player1_rounds: number | null;
  ranked_player2_rounds: number | null;
  royale_players: RoyalePlayer[] | null;
  max_players: number | null;
  // Per-round image map for Battle Royale: { [playerId]: imageUrl }
  royale_player_images: Record<string, string> | null;
};

export type PoseCategory =
  | "sculpture"
  | "cinema"
  | "sport"
  | "peinture"
  | "yoga"
  | "ballet"
  | "martial_arts"
  | "art";

export type Pose = {
  id: string;
  title: string;
  artist: string;
  category: PoseCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  imageUrl: string; // mapped from DB image_url
};

export type ScoreResult = {
  player1Score: number;
  player2Score: number;
  player1Roast: string;
  player2Roast: string;
  winner: "player1" | "player2" | "tie";
};

export type PracticeResult = {
  score: number;
  roast: string;
};
