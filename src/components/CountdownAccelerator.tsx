"use client";

import { useState } from "react";
import { updateRoomState } from "@/lib/supabase";
import type { Room } from "@/lib/game";

const OPTIONS = [2, 3, 4, 5] as const;

export default function CountdownAccelerator({
  roomId,
  totalSeconds,
  currentSeconds,
  className = "",
}: {
  roomId: string;
  totalSeconds: number;
  currentSeconds: number;
  className?: string;
}) {
  const [busy, setBusy] = useState<number | null>(null);

  async function shortenCountdown(targetSeconds: number) {
    if (busy || targetSeconds >= currentSeconds) return;
    setBusy(targetSeconds);
    const startedAt = new Date(Date.now() - (totalSeconds - targetSeconds) * 1000).toISOString();
    await updateRoomState(roomId, "PREVIEW", {
      preview_started_at: startedAt,
    } as Partial<Room>);
    setBusy(null);
  }

  return (
    <div className={["rounded-2xl border border-surface-border bg-surface p-3 shadow-glass backdrop-blur-md", className].join(" ")}>
      <p className="mb-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
        Raccourcir l&apos;aperçu
      </p>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option}
            className="min-h-[40px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-2 text-sm font-black text-white active:scale-95 disabled:opacity-30 hover:bg-white/[0.08] transition-all"
            disabled={busy !== null || option >= currentSeconds}
            onClick={() => shortenCountdown(option)}
          >
            {busy === option ? "…" : `${option}s`}
          </button>
        ))}
      </div>
    </div>
  );
}
