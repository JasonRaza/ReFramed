"use client";

export const AVATARS = [
  "🐺", "🦊", "🐻", "🦁", "🐸", "🦉",
  "🐧", "🦈", "🤖", "🦋", "🐙", "🦅",
] as const;

export const AVATAR_COLORS = [
  { key: "violet", bg: "linear-gradient(135deg,#7c3aed,#4c1d95)" },
  { key: "rose",   bg: "linear-gradient(135deg,#ec4899,#881337)" },
  { key: "orange", bg: "linear-gradient(135deg,#f97316,#7c2d12)" },
  { key: "lime",   bg: "linear-gradient(135deg,#84cc16,#14532d)" },
  { key: "sky",    bg: "linear-gradient(135deg,#0ea5e9,#0c4a6e)" },
  { key: "teal",   bg: "linear-gradient(135deg,#14b8a6,#134e4a)" },
  { key: "amber",  bg: "linear-gradient(135deg,#f59e0b,#78350f)" },
  { key: "coral",  bg: "linear-gradient(135deg,#f43f5e,#4c0519)" },
] as const;

export type AvatarColorKey = typeof AVATAR_COLORS[number]["key"];

export const DEFAULT_AVATAR = "🐺|violet";

export function parseAvatar(avatar: string): { emoji: string; colorKey: string } {
  const [emoji, colorKey = "violet"] = avatar.split("|");
  return { emoji: emoji ?? "🐺", colorKey };
}

export function getBg(colorKey: string): string {
  return AVATAR_COLORS.find((c) => c.key === colorKey)?.bg ?? AVATAR_COLORS[0].bg;
}

const SIZES = { sm: 32, md: 44, lg: 64, xl: 88 } as const;
const FONTS = { sm: "14px", md: "20px", lg: "30px", xl: "42px" } as const;

interface AvatarProps {
  avatar: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function Avatar({ avatar, size = "md", className = "" }: AvatarProps) {
  const { emoji, colorKey } = parseAvatar(avatar);
  const px = SIZES[size];
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 select-none shadow-inner border border-white/10 ${className}`}
      style={{ width: px, height: px, background: getBg(colorKey), fontSize: FONTS[size] }}
    >
      {emoji}
    </div>
  );
}
