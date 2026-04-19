"use client";

import { useEffect, useRef } from "react";

type AmpRef = { current: number };

type Props = {
  size?: number;
  live: boolean;
  muted?: boolean;
  userAmpRef: AmpRef;
  modelAmpRef: AmpRef;
};

const COLS = 44;
const ROWS = 22;
const RAMP = [" ", "·", ":", "•", "○", "●", "█"];
const CHAR_ASPECT = 0.6;

export function MiraOrb({
  size = 280,
  live,
  muted = false,
  userAmpRef,
  modelAmpRef,
}: Props) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    startRef.current = performance.now();

    const cx = COLS / 2;
    const cy = ROWS / 2;

    const loop = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const userAmp = live ? userAmpRef.current : 0;
      const modelAmp = live ? modelAmpRef.current : 0;

      const idle = 0.28 + 0.04 * Math.sin(t * 0.7);
      const energy = live
        ? 0.45 + userAmp * 0.55 + modelAmp * 0.85
        : idle;

      const orbit = 2.6 + energy * 2.1;
      const radius = 3.1 + energy * 2.3;
      const r2 = radius * radius;
      const speed = live ? 1.0 : 0.35;
      const a = t * speed;

      const centers: [number, number][] = [
        [
          cx + Math.cos(a) * orbit,
          cy + Math.sin(a * 1.3) * orbit * 0.5,
        ],
        [
          cx + Math.cos(a * 1.4 + 2.1) * orbit * 0.8,
          cy + Math.sin(a * 0.9 + 1.3) * orbit * 0.55,
        ],
        [
          cx + Math.cos(a * 0.7 + 4.2) * orbit * 0.6,
          cy + Math.sin(a * 1.6 + 3.1) * orbit * 0.5,
        ],
      ];

      let out = "";
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let field = 0;
          for (let i = 0; i < centers.length; i++) {
            const dx = (x - centers[i][0]) * CHAR_ASPECT;
            const dy = y - centers[i][1];
            const d2 = dx * dx + dy * dy + 0.01;
            field += r2 / d2;
          }
          let idx: number;
          if (field < 0.22) idx = 0;
          else if (field < 0.45) idx = 1;
          else if (field < 0.9) idx = 2;
          else if (field < 1.55) idx = 3;
          else if (field < 2.5) idx = 4;
          else if (field < 4.2) idx = 5;
          else idx = 6;
          out += RAMP[idx];
        }
        if (y < ROWS - 1) out += "\n";
      }
      el.textContent = out;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [live, userAmpRef, modelAmpRef]);

  const fontSize = (size / COLS) / CHAR_ASPECT;

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className="select-none font-mono"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        letterSpacing: 0,
        whiteSpace: "pre",
        color: muted ? "#AAAAAA" : "#1A1A1A",
        opacity: muted ? 0.55 : 1,
        margin: 0,
        width: `${size}px`,
        textAlign: "center",
        transition: "opacity 240ms ease",
      }}
    />
  );
}
