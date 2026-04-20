"use client";

import { useEffect, useRef } from "react";
import type { CardEvent } from "@/lib/mira/tools";
import { MiraSparkle } from "@/components/preview/mira-sparkle";

type Props = { event: CardEvent };

const TYPE_ICON: Record<CardEvent["type"], string> = {
  todo: "📋",
  win: "✨",
  contact: "👤",
  email: "✉️",
  food: "🍛",
  pitch: "🎯",
  followup: "🔁",
  fade: "📉",
};

const TYPE_LABEL: Record<CardEvent["type"], string> = {
  todo: "Todo added",
  win: "Win captured",
  contact: "Contact added",
  email: "Draft ready",
  food: "Logged",
  pitch: "Pitch summary",
  followup: "Follow-up drafted",
  fade: "Reconnect",
};

export function MiraCard({ event }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: "ease-out",
          fill: "forwards",
        });
        return;
      }
    }
    el.animate(
      [
        { opacity: 0, transform: "translateY(12px) scale(0.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
  }, [event.id]);

  return (
    <div
      ref={ref}
      className="relative w-full rounded-xl border border-[#E5E5E3] bg-white shadow-sm px-4 py-3 opacity-0"
      style={{ willChange: "transform, opacity" }}
    >
      <MiraSparkle />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[15px] leading-none">{TYPE_ICON[event.type]}</span>
        <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-[#AAAAAA]">
          {TYPE_LABEL[event.type]}
        </span>
      </div>
      <Body event={event} />
    </div>
  );
}

function PitchSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] font-sans uppercase tracking-[0.08em] text-[#AAAAAA] mb-1">
        {label}
      </p>
      <ul className="text-[12px] font-sans text-[#1A1A1A] leading-[1.5] list-disc pl-4 marker:text-[#AAAAAA]">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function Body({ event }: { event: CardEvent }) {
  switch (event.type) {
    case "todo":
      return (
        <>
          <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.5]">
            {event.payload.title}
          </p>
          {event.payload.due && (
            <span className="inline-block mt-2 text-[11px] font-sans text-[#888888] bg-[#F5F5F3] rounded-full px-2 py-0.5">
              {event.payload.due}
            </span>
          )}
        </>
      );
    case "win":
      return (
        <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.5]">
          {event.payload.text}
        </p>
      );
    case "contact": {
      const { name, role, company, headline, tags } = event.payload;
      const subtitle = [role, company].filter(Boolean).join(" · ");
      return (
        <>
          <p className="text-[15px] font-sans font-medium text-[#1A1A1A] leading-[1.3]">
            {name}
          </p>
          {subtitle && (
            <p className="text-[12px] font-sans text-[#888888] mt-0.5">{subtitle}</p>
          )}
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.5]">
            {headline}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[11px] font-sans text-[#1A1A1A] bg-[#F5F5F3] rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        </>
      );
    }
    case "email": {
      const { to, subject, body } = event.payload;
      return (
        <>
          <p className="text-[12px] font-sans text-[#888888]">
            To <span className="text-[#1A1A1A]">{to}</span>
          </p>
          <p className="text-[14px] font-sans font-medium text-[#1A1A1A] mt-1">
            {subject}
          </p>
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.6] line-clamp-3">
            {body}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-sans text-[#888888]">
            Review →
          </div>
        </>
      );
    }
    case "food": {
      const { item, qty, kcal } = event.payload;
      return (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.3]">
              {qty > 1 ? `${qty} × ${item}` : item}
            </p>
            <p className="text-[11px] font-sans text-[#888888] mt-0.5">
              ~{kcal} kcal
            </p>
          </div>
          <p className="text-[20px] font-serif text-[#1A1A1A] leading-none">
            {kcal}
          </p>
        </div>
      );
    }
    case "pitch": {
      const { topic, wins, objections, next } = event.payload;
      return (
        <>
          <p className="text-[12px] font-sans text-[#888888]">{topic}</p>
          <PitchSection label="Wins" items={wins} />
          <PitchSection label="Objections" items={objections} />
          <PitchSection label="Next" items={next} />
        </>
      );
    }
    case "followup": {
      const { contactName, company, body } = event.payload;
      return (
        <>
          <p className="text-[14px] font-sans text-[#1A1A1A]">
            {contactName}
            <span className="text-[#888888]"> · {company}</span>
          </p>
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.6] line-clamp-3">
            {body}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-sans text-[#888888]">
            Send →
          </div>
        </>
      );
    }
    case "fade":
      return (
        <ul className="flex flex-col gap-2 mt-0.5">
          {event.payload.contacts.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-sans text-[#1A1A1A] truncate">
                  {c.name}
                </p>
                <p className="text-[11px] font-sans text-[#888888] truncate">
                  {c.context}
                </p>
              </div>
              {c.liveEvent && (
                <span className="shrink-0 text-[11px] font-sans font-medium text-white bg-[#1A1A1A] rounded-full px-2.5 py-0.5">
                  Call
                </span>
              )}
            </li>
          ))}
        </ul>
      );
  }
}
