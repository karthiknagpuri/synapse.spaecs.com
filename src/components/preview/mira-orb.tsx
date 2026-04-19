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

export function MiraOrb({
  size = 280,
  live,
  muted = false,
  userAmpRef,
  modelAmpRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    startRef.current = performance.now();

    const draw = (now: number) => {
      const t = (now - startRef.current) / 1000;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const coreBase = size * 0.22;

      const breathing = 0.95 + Math.sin((t / 2) * Math.PI) * 0.025 + 0.025;
      const userAmp = live ? userAmpRef.current : 0;
      const modelAmp = live ? modelAmpRef.current : 0;

      const scale = live
        ? 1 + userAmp * 0.05 + modelAmp * 0.08
        : breathing;

      const dim = muted ? 0.35 : 1;
      const baseRingAlpha = live ? 0.55 : 0.35;

      ctx.fillStyle = muted ? "#888888" : "#1A1A1A";

      const ring = (radius: number, color: string, alpha: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * dim;
        ctx.fill();
      };

      ring(
        coreBase * scale * 2.4,
        "#E5E5E3",
        baseRingAlpha * 0.45 + modelAmp * 0.25
      );
      ring(
        coreBase * scale * 1.85,
        "#AAAAAA",
        baseRingAlpha * 0.55 + modelAmp * 0.2
      );
      ring(
        coreBase * scale * 1.35,
        "#888888",
        baseRingAlpha * 0.65 + userAmp * 0.25
      );

      ctx.globalAlpha = dim;
      ctx.beginPath();
      ctx.arc(cx, cy, coreBase * scale, 0, Math.PI * 2);
      ctx.fillStyle = muted ? "#888888" : "#1A1A1A";
      ctx.fill();
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [live, muted, size, userAmpRef, modelAmpRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="select-none"
    />
  );
}
