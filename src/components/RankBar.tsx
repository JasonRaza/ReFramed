import type { RankSnapshot } from "@/lib/rank";

const RANK_COLORS: Record<string, string> = {
  Bronze:  "#cd7f32",
  Argent:  "#9ca3af",
  Or:      "#f6b73c",
  Platine: "#67e8f9",
  Diamant: "#818cf8",
  Légende: "#f472b6",
};

interface Props {
  rank: RankSnapshot;
}

export default function RankBar({ rank }: Props) {
  const color = RANK_COLORS[rank.label] ?? "#f6b73c";
  const pct   = Math.round(rank.progress * 100);

  return (
    <div className="rounded-lg bg-[#1a1a1a] border border-[#222] px-4 py-4">
      {/* Top row: rank label + points */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-[#555] leading-none mb-1 uppercase tracking-wider">Rang actuel</p>
          <p
            className="text-[15px] font-bold leading-none"
            style={{ color }}
          >
            {rank.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#555] leading-none mb-1 uppercase tracking-wider">Points</p>
          <p className="text-[22px] font-bold text-white leading-none tabular-nums">{rank.points}</p>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="relative h-2 rounded-full bg-[#111] overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>

      {/* Progress label */}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-[#444]">{pct}%</p>
        {rank.nextLabel ? (
          <p className="text-[10px] text-[#444]">
            Prochain : <span style={{ color }} className="opacity-70">{rank.nextLabel}</span>
          </p>
        ) : (
          <p className="text-[10px] text-[#444]">Rang max ✦</p>
        )}
      </div>
    </div>
  );
}
