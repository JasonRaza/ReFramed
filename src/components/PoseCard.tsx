"use client";

import Image from "next/image";
import type { Pose } from "@/lib/game";

interface Props {
  pose: Pose;
  /** full = fills its container with gradient overlay. thumb = compact card. */
  size?: "full" | "thumb";
}

export default function PoseCard({ pose, size = "full" }: Props) {
  if (size === "thumb") {
    return (
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] w-full">
        <Image
          src={pose.imageUrl}
          alt={pose.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="truncate text-xs font-medium text-white">{pose.title}</p>
          <p className="truncate text-[10px] text-white/50">{pose.artist}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full">
      <Image
        src={pose.imageUrl}
        alt={pose.title}
        fill
        className="object-cover"
        unoptimized
        priority
      />
      {/* Bottom gradient overlay with pose info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-8 pt-24">
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-purple-300">
          Mémorise la pose
        </p>
        <h2 className="text-2xl font-black leading-tight">{pose.title}</h2>
        <p className="mt-1 text-sm text-white/60">{pose.artist}</p>
      </div>
    </div>
  );
}
