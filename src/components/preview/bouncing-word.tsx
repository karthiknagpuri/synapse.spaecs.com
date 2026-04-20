"use client";

import { useEffect, useRef } from "react";

type Props = {
  text: string;
  delay?: number;
};

export function BouncingWord({ text, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 180,
          easing: "ease-out",
          fill: "forwards",
        });
        return;
      }
    }
    el.animate(
      [
        { opacity: 0, transform: "translateY(14px) scale(0.7)" },
        { opacity: 1, transform: "translateY(-4px) scale(1.08)", offset: 0.55 },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 420,
        delay,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fill: "forwards",
      }
    );
  }, [delay]);

  return (
    <span
      ref={ref}
      className="inline-block px-3 py-1.5 rounded-full bg-[#F5F5F3] text-[15px] font-sans text-[#1A1A1A] opacity-0"
      style={{ willChange: "transform, opacity" }}
    >
      {text}
    </span>
  );
}
