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
const NUM_PARTICLES = 520;
const SYMBOL_SIZE = 11;

const WORDS_IDLE = ["HELLO", "MIRA", "LISTEN"];
const WORDS_LIVE = ["LISTENING", "MIRA", "HELLO"];
const PHASE_MS = 4500;
const MORPH_IN_START = 0.1;
const MORPH_IN_END = 0.3;
const MORPH_OUT_START = 0.75;
const MORPH_OUT_END = 0.95;

type Point = { x: number; y: number };

type Particle = {
  sym: string;
  homeAngle: number;
  homeRadius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function sampleWordPositions(word: string, count: number, canvasSize: number): Point[] {
  const c = document.createElement("canvas");
  c.width = canvasSize;
  c.height = canvasSize;
  const cx = c.getContext("2d");
  if (!cx) return [];

  cx.fillStyle = "#000";
  cx.textAlign = "center";
  cx.textBaseline = "middle";

  let fontSize = Math.floor(canvasSize * 0.28);
  const fitFont = () => {
    cx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Inter", sans-serif`;
  };
  fitFont();
  while (cx.measureText(word).width > canvasSize * 0.72 && fontSize > 18) {
    fontSize -= 2;
    fitFont();
  }
  while (cx.measureText(word).width < canvasSize * 0.48 && fontSize < canvasSize * 0.42) {
    fontSize += 2;
    fitFont();
  }
  cx.fillText(word, canvasSize / 2, canvasSize / 2);

  const img = cx.getImageData(0, 0, canvasSize, canvasSize);
  const pts: Point[] = [];
  for (let y = 0; y < canvasSize; y += 2) {
    for (let x = 0; x < canvasSize; x += 2) {
      const idx = (y * canvasSize + x) * 4;
      if (img.data[idx + 3] > 128) {
        pts.push({ x, y });
      }
    }
  }

  const result: Point[] = [];
  if (pts.length === 0) {
    for (let i = 0; i < count; i++) {
      result.push({ x: canvasSize / 2, y: canvasSize / 2 });
    }
    return result;
  }
  for (let i = 0; i < count; i++) {
    const p = pts[Math.floor(Math.random() * pts.length)];
    result.push({ x: p.x + (Math.random() - 0.5) * 2, y: p.y + (Math.random() - 0.5) * 2 });
  }
  return result;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function MiraOrb({
  size = 280,
  live,
  muted = false,
  userAmpRef,
  modelAmpRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const liveRef = useRef(live);

  liveRef.current = live;

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

    const idleTargets: Point[][] = WORDS_IDLE.map((w) =>
      sampleWordPositions(w, NUM_PARTICLES, size)
    );
    const liveTargets: Point[][] = WORDS_LIVE.map((w) =>
      sampleWordPositions(w, NUM_PARTICLES, size)
    );

    const mouse = { x: -9999, y: -9999, active: false };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    const start = performance.now();
    let swirl = 0;
    let waveTime = 0;

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      const isLive = liveRef.current;
      const userAmp = isLive ? userAmpRef.current : 0;
      const modelAmp = isLive ? modelAmpRef.current : 0;
      const energy = isLive
        ? 0.45 + userAmp * 0.55 + modelAmp * 0.8
        : 0.22 + 0.05 * Math.sin(t * 0.7);

      const swirlSpeed = (isLive ? 0.0045 : 0.0018) + energy * 0.006;
      const waveAmp = isLive ? 1.4 + energy * 3.0 : 0.7;
      const waveFreq = 0.03 + energy * 0.05;
      const tension = 0.07;
      const damping = 0.88;

      swirl += swirlSpeed;
      waveTime += waveFreq;

      const wordList = isLive ? liveTargets : idleTargets;
      const elapsed = now - start;
      let wordTargets: Point[] | undefined;
      let morphEased = 0;
      if (wordList.length > 0) {
        const phaseIndex = Math.floor(elapsed / PHASE_MS) % wordList.length;
        const phase = (elapsed % PHASE_MS) / PHASE_MS;
        let morph = 0;
        if (phase < MORPH_IN_START) morph = 0;
        else if (phase < MORPH_IN_END)
          morph = (phase - MORPH_IN_START) / (MORPH_IN_END - MORPH_IN_START);
        else if (phase < MORPH_OUT_START) morph = 1;
        else if (phase < MORPH_OUT_END)
          morph =
            1 - (phase - MORPH_OUT_START) / (MORPH_OUT_END - MORPH_OUT_START);
        else morph = 0;
        morphEased = easeInOutCubic(morph);
        const candidate = wordList[phaseIndex];
        if (candidate && candidate.length >= particles.length) {
          wordTargets = candidate;
        } else {
          morphEased = 0;
        }
      }

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = muted ? "#AAAAAA" : "#1A1A1A";
      ctx.globalAlpha = muted ? 0.55 : 1;
      ctx.font = `${SYMBOL_SIZE}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace`;

      const mouseRadius = 70;
      const mouseRadius2 = mouseRadius * mouseRadius;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const blobX = cx + Math.cos(p.homeAngle + swirl) * p.homeRadius;
        const blobY = cy + Math.sin(p.homeAngle + swirl) * p.homeRadius;
        const word = wordTargets ? wordTargets[i] : undefined;
        const targetX = word ? word.x : blobX;
        const targetY = word ? word.y : blobY;
        const homeX = blobX * (1 - morphEased) + targetX * morphEased;
        const homeY = blobY * (1 - morphEased) + targetY * morphEased;

        const wave = Math.sin(waveTime + i * 0.15) * waveAmp * (1 - morphEased * 0.7);
        const dx = homeX - p.x;
        const dy = homeY - p.y + wave;

        p.vx = (p.vx + dx * tension) * damping;
        p.vy = (p.vy + dy * tension) * damping;

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const d2 = mdx * mdx + mdy * mdy;
          if (d2 < mouseRadius2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = ((mouseRadius - d) / mouseRadius) * 3.5;
            p.vx += (mdx / d) * force;
            p.vy += (mdy / d) * force;
          }
        }

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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [muted, size, userAmpRef, modelAmpRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="select-none cursor-default"
    />
  );
}
