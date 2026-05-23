"use client";

interface Props {
  seconds: number;
  /** Turns the counter red when true — typically when ≤ 8 seconds remain. */
  urgent?: boolean;
}

export default function CountdownTimer({ seconds, urgent = false }: Props) {
  return (
    <span
      className={`text-4xl font-black tabular-nums transition-colors duration-300 ${
        urgent ? "text-red-500" : "text-white"
      }`}
    >
      {seconds}
    </span>
  );
}
