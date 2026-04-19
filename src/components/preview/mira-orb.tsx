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

const SYMBOLS =
  "@#%&$*=+-~!()[]{}?/\\|ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(
    ""
  );
const NUM_PARTICLES = 450;
const SYMBOL_SIZE = 11;

type Particle = {
  sym: string;
  homeAngle: number;
  homeRadius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cx = size / 2;
    const cy = size / 2;
    const blobRadius = size * 0.4;

    const particles: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * blobRadius;
      particles.push({
        sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        homeAngle: angle,
        homeRadius: r,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      });
    }

    const start = performance.now();
    let swirl = 0;
    let waveTime = 0;

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      const userAmp = live ? userAmpRef.current : 0;
      const modelAmp = live ? modelAmpRef.current : 0;
      const energy = live
        ? 0.45 + userAmp * 0.55 + modelAmp * 0.8
        : 0.2 + 0.05 * Math.sin(t * 0.7);

      const swirlSpeed = (live ? 0.004 : 0.0015) + energy * 0.006;
      const waveAmp = live ? 1.5 + energy * 3.5 : 0.8;
      const waveFreq = 0.03 + energy * 0.05;
      const tension = 0.045;
      const damping = 0.88;

      swirl += swirlSpeed;
      waveTime += waveFreq;

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = muted ? "#AAAAAA" : "#1A1A1A";
      ctx.globalAlpha = muted ? 0.55 : 1;
      ctx.font = `${SYMBOL_SIZE}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace`;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const homeX = cx + Math.cos(p.homeAngle + swirl) * p.homeRadius;
        const homeY = cy + Math.sin(p.homeAngle + swirl) * p.homeRadius;

        const wave = Math.sin(waveTime + i * 0.15) * waveAmp;
        const dx = homeX - p.x;
        const dy = homeY - p.y + wave;

        p.vx = (p.vx + dx * tension) * damping;
        p.vy = (p.vy + dy * tension) * damping;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillText(p.sym, p.x, p.y);
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
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
