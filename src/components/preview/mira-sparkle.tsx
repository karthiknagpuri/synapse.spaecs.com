"use client";

import { useEffect, useRef } from "react";

type Props = {
  count?: number;
  distance?: number;
  duration?: number;
  size?: number;
};

export function MiraSparkle({
  count = 8,
  distance = 40,
  duration = 600,
  size = 3,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    const children = host.children;
    for (let i = 0; i < children.length; i++) {
      const angle = (i / children.length) * Math.PI * 2 + Math.random() * 0.4;
      const d = distance + Math.random() * 12;
      const dx = Math.cos(angle) * d;
      const dy = Math.sin(angle) * d;
      (children[i] as HTMLElement).animate(
        [
          { transform: "translate(0, 0)", opacity: 0.9 },
          { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, opacity: 0 },
        ],
        { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
    }
  }, [count, distance, duration]);

  const dots = Array.from({ length: count });
  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-2 right-2"
      style={{ width: 0, height: 0 }}
    >
      {dots.map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#1A1A1A",
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
