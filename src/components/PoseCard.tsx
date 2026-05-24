"use client";

import { useState } from "react";
import Image from "next/image";
import type { Pose } from "@/lib/game";

interface Props {
  pose: Pose;
  /** full = fills its container with gradient overlay. thumb = compact card. */
  size?: "full" | "thumb";
}

export default function PoseCard({ pose, size = "full" }: Props) {
  const [imgError, setImgError] = useState(false);

  if (size === "thumb") {
    return (
      <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] w-full border border-surface-border shadow-glass bg-ink">
        {!imgError ? (
          <Image
            src={pose.imageUrl}
            alt={pose.title}
            fill
            className="object-contain transition-transform duration-700 group-hover:scale-105"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-ink" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-4">
          <p className="truncate text-sm font-bold text-white">{pose.title}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/50">{pose.artist}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full overflow-hidden bg-black">
      {!imgError ? (
        <Image
          src={pose.imageUrl}
          alt={pose.title}
          fill
          className="object-contain"
          unoptimized
          priority
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-ink to-ink" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 pt-24">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 mb-3 backdrop-blur-md">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Mémorise la pose
          </p>
        </div>
        <h2 className="text-3xl font-black leading-tight tracking-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{pose.title}</h2>
        <p className="mt-1 text-sm font-medium text-white/60">{pose.artist}</p>
      </div>
    </div>
  );
}
