"use client";

// ─── Web Audio context (lazy, singleton) ─────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx) {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      _ctx = new Ctor();
    }
    return _ctx;
  } catch {
    return null;
  }
}

async function resume(c: AudioContext): Promise<void> {
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* browser blocks before user gesture — silent failure */
    }
  }
}

// ─── Camera shutter ───────────────────────────────────────────────────────────

/**
 * Short mechanical click — call on photo capture.
 * Safe to call without awaiting; errors are swallowed.
 */
export async function playCameraShutter(): Promise<void> {
  const c = getCtx();
  if (!c) return;
  try {
    await resume(c);
    const t = c.currentTime;

    // Tonal click: descending pitch sweep
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.connect(oscGain);
    oscGain.connect(c.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.12);

    // Noise burst: mechanical clack
    const bufLen = Math.floor(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = c.createBufferSource();
    noise.buffer = buf;
    const noiseGain = c.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(c.destination);
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.start(t);
  } catch {
    /* silence any unexpected error */
  }
}

// ─── Drumroll ─────────────────────────────────────────────────────────────────

let _drumrollActive = false;

export function stopDrumroll(): void {
  _drumrollActive = false;
}

/**
 * Accelerating snare drumroll — call on scoring screen mount.
 * Stops automatically after `durationMs`.
 */
export async function playDrumroll(durationMs = 2500): Promise<void> {
  stopDrumroll();
  const raw = getCtx();
  if (!raw) return;
  // Rebind as non-nullable so TypeScript trusts the closure
  const c: AudioContext = raw;
  try {
    await resume(c);
    _drumrollActive = true;
    const startedAt = performance.now();

    function scheduleHit() {
      if (!_drumrollActive) return;
      const elapsed = performance.now() - startedAt;
      if (elapsed >= durationMs) {
        _drumrollActive = false;
        return;
      }
      const progress = elapsed / durationMs;

      // Interval: 250 ms → 40 ms (exponential acceleration)
      const interval = Math.max(40, 250 * Math.pow(1 - progress, 1.2));
      // Gain: 0.12 → 0.50
      const gainVal = 0.12 + progress * 0.38;

      try {
        const bufLen = Math.floor(c.sampleRate * 0.025);
        const buf = c.createBuffer(1, bufLen, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const src = c.createBufferSource();
        src.buffer = buf;

        const filter = c.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 180 + progress * 700;
        filter.Q.value = 0.8;

        const g = c.createGain();
        src.connect(filter);
        filter.connect(g);
        g.connect(c.destination);

        const now = c.currentTime;
        g.gain.setValueAtTime(gainVal, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        src.start(now);
        src.stop(now + 0.03);
      } catch {
        /* carry on */
      }

      setTimeout(scheduleHit, interval);
    }

    scheduleHit();
    setTimeout(stopDrumroll, durationMs);
  } catch {
    /* silence */
  }
}

// ─── Victory fanfare ──────────────────────────────────────────────────────────

/**
 * Four-note ascending arpeggio (C5–E5–G5–C6).
 * Call on results screen mount after determining the winner.
 */
export async function playFanfare(): Promise<void> {
  stopDrumroll(); // cancel any lingering drumroll
  const c = getCtx();
  if (!c) return;
  try {
    await resume(c);
    const t = c.currentTime;

    // C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;

      const start = t + i * 0.13;
      const dur = i === notes.length - 1 ? 0.65 : 0.18;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.setValueAtTime(0.22, start + dur - 0.04);
      gain.gain.linearRampToValueAtTime(0, start + dur);

      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  } catch {
    /* silence */
  }
}
