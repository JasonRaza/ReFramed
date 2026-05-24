"use client";

import { useEffect, useState } from "react";
import { X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import { useLocale, type TranslationKey } from "@/hooks/useLocale";

type Placement = "center" | "right" | "bottom" | "top";

type Step = {
  target?: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  placement: Placement;
};

const STEPS: Step[] = [
  { titleKey: "tutoWelcomeTitle", descKey: "tutoWelcomeDesc", placement: "center" },
  { target: "sidebar",          titleKey: "tutoNavTitle",    descKey: "tutoNavDesc",    placement: "right"  },
  { target: "topbar-controls",  titleKey: "tutoTopbarTitle", descKey: "tutoTopbarDesc", placement: "bottom" },
  { target: "mode-list",        titleKey: "tutoModesTitle",  descKey: "tutoModesDesc",  placement: "top"    },
  { titleKey: "tutoFinishTitle", descKey: "tutoFinishDesc",  placement: "center" },
];

type Rect = { left: number; top: number; width: number; height: number };

const PAD = 10;
const TOOLTIP_W = 280;

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  useEffect(() => {
    if (!current.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step, current.target]);

  function advance() {
    if (isLast) { onClose(); return; }
    setStep((s) => s + 1);
  }

  function safeLeft(v: number) {
    return Math.max(16, Math.min(v, window.innerWidth - TOOLTIP_W - 16));
  }

  function tooltipStyle(): React.CSSProperties {
    const gap   = PAD + 16;
    const right  = rect ? rect.left + rect.width  : 0;
    const bottom = rect ? rect.top  + rect.height : 0;
    if (!rect || current.placement === "center") {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
    }
    if (current.placement === "right") {
      return { position: "fixed", left: right + gap, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };
    }
    if (current.placement === "bottom") {
      return { position: "fixed", left: safeLeft(rect.left), top: bottom + gap };
    }
    // top
    return { position: "fixed", left: safeLeft(rect.left), bottom: window.innerHeight - rect.top + gap };
  }

  function arrowStyle(): React.CSSProperties | null {
    if (!rect || current.placement === "center") return null;
    const right  = rect.left + rect.width;
    const bottom = rect.top  + rect.height;
    if (current.placement === "right") {
      return { position: "fixed", left: right + PAD + 2, top: rect.top + rect.height / 2, transform: "translateY(-50%)" };
    }
    if (current.placement === "bottom") {
      return { position: "fixed", left: rect.left + rect.width / 2, top: bottom + PAD + 2, transform: "translateX(-50%)" };
    }
    // top
    return { position: "fixed", left: rect.left + rect.width / 2, top: rect.top - PAD - 26, transform: "translateX(-50%)" };
  }

  function ArrowIcon() {
    if (!rect || current.placement === "center") return null;
    const props = { size: 22, strokeWidth: 2.5, style: { color: "#f6b73c" }, className: "animate-bounce" } as const;
    if (current.placement === "right")  return <ChevronLeft  {...props} />;
    if (current.placement === "bottom") return <ChevronUp    {...props} />;
    if (current.placement === "top")    return <ChevronDown  {...props} />;
    return null;
  }

  const arrow = arrowStyle();

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>

      {/* ── Overlay with spotlight hole ── */}
      {rect ? (() => {
        const rRight  = rect.left + rect.width;
        const rBottom = rect.top  + rect.height;
        return (
        <>
          {/* Top strip */}
          <div className="fixed bg-black/70"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) }} />
          {/* Bottom strip */}
          <div className="fixed bg-black/70"
            style={{ top: rBottom + PAD, left: 0, right: 0, bottom: 0 }} />
          {/* Left strip */}
          <div className="fixed bg-black/70"
            style={{ top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          {/* Right strip */}
          <div className="fixed bg-black/70"
            style={{ top: rect.top - PAD, left: rRight + PAD, right: 0, height: rect.height + PAD * 2 }} />
          {/* Pulsing highlight ring */}
          <div
            className="fixed pointer-events-none rounded-xl"
            style={{
              left: rect.left - PAD,
              top:  rect.top  - PAD,
              width:  rect.width  + PAD * 2,
              height: rect.height + PAD * 2,
              border:    "2.5px solid #f6b73c",
              animation: "tuto-pulse 1.4s ease-in-out infinite",
            }}
          />
        </>
        );
      })() : (
        <div className="fixed inset-0 bg-black/70" />
      )}

      {/* ── Directional arrow ── */}
      {arrow && (
        <div style={arrow} className="pointer-events-none z-10">
          <ArrowIcon />
        </div>
      )}

      {/* ── Tooltip card ── */}
      <div
        style={{ ...tooltipStyle(), width: TOOLTIP_W, zIndex: 10 }}
        className="rounded-2xl border border-[#2a2a2a] bg-[#131313] p-5 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-[14px] font-bold leading-snug text-white">
            {t[current.titleKey]}
          </p>
          <button
            onClick={onClose}
            className="mt-0.5 flex-shrink-0 text-[#555] hover:text-[#888] transition-colors"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <p className="text-[12px] leading-relaxed text-[#888] mb-5">
          {t[current.descKey]}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === step ? 16 : 6,
                  height:     6,
                  background: i === step ? "#f6b73c" : "#2a2a2a",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
            >
              {t.skipAll}
            </button>
            <button
              onClick={advance}
              className="flex items-center gap-1 rounded-lg bg-[#f6b73c] px-3 py-1.5 text-[11px] font-bold text-black hover:opacity-90 transition-opacity"
            >
              {isLast ? t.finishBtn : t.nextBtn}
              {!isLast && <ChevronRight size={11} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
