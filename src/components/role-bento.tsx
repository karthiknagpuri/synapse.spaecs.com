"use client";

import { useEffect, useRef, useState } from "react";

type Role = {
  name: string;
  count: string;
  initials: string[];
  pillTone: string;
};

const ROLES: Role[] = [
  { name: "Founders", count: "1,284", initials: ["JL", "MK", "AT", "SR", "DH"], pillTone: "#1A1A1A" },
  { name: "Investors", count: "412", initials: ["PV", "NC", "RB"], pillTone: "#3D3D3A" },
  { name: "Developers", count: "2,967", initials: ["EM", "KS", "TN"], pillTone: "#5C5C58" },
  { name: "Designers", count: "836", initials: ["LA", "YO", "MC"], pillTone: "#7A7A75" },
  { name: "Operators", count: "593", initials: ["BF", "HI"], pillTone: "#9B9B96" },
  { name: "Marketers", count: "721", initials: ["CR", "ZE"], pillTone: "#B8B8B2" },
];

function PfpPills({ initials, tone }: { initials: string[]; tone: string }) {
  return (
    <div className="flex -space-x-2">
      {initials.map((i, idx) => (
        <div
          key={idx}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-sans font-medium text-white ring-2 ring-[#FAFAF8]"
          style={{ backgroundColor: tone, opacity: 1 - idx * 0.12 }}
        >
          {i}
        </div>
      ))}
    </div>
  );
}

function RoleTile({
  role,
  size,
}: {
  role: Role;
  size: "lg" | "md" | "sm";
}) {
  const countSize =
    size === "lg"
      ? "text-[56px] lg:text-[72px]"
      : size === "md"
      ? "text-[36px] lg:text-[44px]"
      : "text-[28px] lg:text-[32px]";
  const padding = size === "lg" ? "p-8 lg:p-10" : size === "md" ? "p-6" : "p-5";
  return (
    <div
      className={`bg-[#FAFAF8] border border-[#E5E5E3] rounded-xl ${padding} flex flex-col justify-between hover:border-[#D5D5D3] transition-colors duration-200`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[#AAAAAA] text-[12px] font-sans uppercase tracking-[0.08em]">
          {role.name}
        </p>
        <PfpPills initials={role.initials.slice(0, size === "lg" ? 5 : 3)} tone={role.pillTone} />
      </div>
      <div className="mt-6">
        <p className={`${countSize} text-[#1A1A1A] font-normal leading-none font-serif`}>
          {role.count}
        </p>
        <p className="text-[#888888] text-[13px] font-sans mt-2">
          on Synapse
        </p>
      </div>
    </div>
  );
}

export function RoleBento() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`pb-20 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <p className="text-[#AAAAAA] text-sm font-sans mb-6">Network</p>
      <div className="grid grid-cols-1 sm:grid-cols-8 grid-rows-[auto] sm:grid-rows-3 gap-3 sm:h-[480px]">
        <div className="sm:col-span-5 sm:row-span-3">
          <RoleTile role={ROLES[0]} size="lg" />
        </div>
        <div className="sm:col-span-3 sm:row-span-2">
          <RoleTile role={ROLES[1]} size="md" />
        </div>
        <div className="sm:col-span-3 sm:row-span-1">
          <RoleTile role={ROLES[2]} size="sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-8 gap-3 mt-3">
        <div className="sm:col-span-3">
          <RoleTile role={ROLES[3]} size="sm" />
        </div>
        <div className="sm:col-span-2">
          <RoleTile role={ROLES[4]} size="sm" />
        </div>
        <div className="sm:col-span-3">
          <RoleTile role={ROLES[5]} size="sm" />
        </div>
      </div>
    </section>
  );
}
