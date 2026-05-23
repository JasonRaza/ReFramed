"use client";

import { useEffect } from "react";

interface Props {
  seconds: number;
  /** Turns the timer red when true (pass `seconds <= threshold` from the parent). */
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
        "rounded-full px-5 py-3 text-3xl font-black tabular-nums transition-colors duration-300",
        urgent ? "bg-red-600 text-white" : "bg-primary text-white",
        className ?? "",
      ].join(" ")}
    >
      {seconds}
    </div>
  );
}
