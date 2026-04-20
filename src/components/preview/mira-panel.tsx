"use client";

import type { CardEvent } from "@/lib/mira/tools";
import { MiraCard } from "@/components/preview/mira-card";

type Props = {
  cards: CardEvent[];
  maxVisible?: number;
};

export function MiraPanel({ cards, maxVisible = 5 }: Props) {
  const visible = cards.slice(-maxVisible);
  return (
    <aside
      aria-label="MIRA actions"
      className="w-full lg:w-[320px] lg:max-w-[320px] flex flex-col gap-3"
    >
      {visible.length === 0 ? null : (
        visible
          .slice()
          .reverse()
          .map((event) => <MiraCard key={event.id} event={event} />)
      )}
    </aside>
  );
}
