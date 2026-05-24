"use client";

import { useEffect } from "react";

interface Props {
  seconds: number;
  urgent?: boolean;
  onComplete?: () => void;
  className?: string;
}

export default function CountdownTimer({ seconds, urgent = false, onComplete, className }: Props) {
  useEffect(() => {
    if (seconds === 0) onComplete?.();
  }, [seconds, onComplete]);

  return (
    <div
      className={[
        "relative flex items-center justify-center rounded-full font-black tabular-nums transition-all duration-300 select-none",
        "h-14 w-14 text-2xl border",
        urgent
          ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-md animate-pulse"
          : "bg-surface border-surface-border text-white shadow-glass backdrop-blur-md",
        className ?? "",
      ].join(" ")}
    >
      {urgent && <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping" />}
      {seconds}
    </div>
  );
}
