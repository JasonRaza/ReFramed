"use client";

import { ChevronRight, Zap, Repeat2, Target, Trophy, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIG: Record<string, {
  icon: React.ElementType;
  accent: string;
  popular?: boolean;
}> = {
  duel:     { icon: Zap,     accent: "#f6b73c", popular: true },
  mirror:   { icon: Repeat2, accent: "#7f77dd" },
  practice: { icon: Target,  accent: "#1d9e75" },
  ranked:   { icon: Trophy,  accent: "#d85a30" },
  royale:   { icon: Crown,   accent: "#888780" },
};

interface Props {
  id: string;
  label: string;
  sub: string;
  onClick: () => void;
}

export default function ModeRow({ id, label, sub, onClick }: Props) {
  const { icon: Icon, accent, popular } = CONFIG[id] ?? { icon: Zap, accent: "#555" };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3.5 overflow-hidden rounded-lg",
        "border px-4 text-left",
        "transition-all duration-150",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        "active:scale-[0.99]",
        popular ? "py-3.5" : "py-3",
      )}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--bg-border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border-subtle)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bg-border)";
      }}
    >
      {/* Left accent bar */}
      <span
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg transition-all duration-150 group-hover:opacity-100 opacity-70"
        style={{ background: accent }}
      />

      {/* Icon */}
      <span
        className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${accent}18` }}
      >
        <Icon size={15} style={{ color: accent }} strokeWidth={2} />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium leading-tight" style={{ color: "var(--text-primary)" }}>{label}</p>
          {popular && (
            <span className="rounded-full bg-[#f6b73c]/15 border border-[#f6b73c]/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f6b73c]">
              Populaire
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--text-muted)" }}>{sub}</p>
      </div>

      {/* Chevron — slides right on hover */}
      <ChevronRight
        size={14}
        className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-1"
        style={{ color: "var(--text-faint)" }}
        strokeWidth={2}
      />
    </button>
  );
}
