"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Brain, Users, BarChart3, Telescope } from "lucide-react";

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex items-center gap-2 border border-[rgba(2,6,23,0.08)]">
      <div className="w-[14px] h-[14px] flex items-center justify-center">{icon}</div>
      <span className="text-[#37322F] text-xs font-medium leading-3 font-sans">{text}</span>
    </div>
  );
}

const features = [
  {
    title: "Semantic network search",
    description: "Ask anything in plain English. Find people by role, company, location, or shared history.",
    icon: Search,
  },
  {
    title: "Stay-in-touch reminders",
    description: "Never let important relationships fade. Get nudges before connections go cold.",
    icon: Bell,
  },
  {
    title: "AI research profiles",
    description: "One-click deep research on any contact. Get talking points, career history, and shared interests.",
    icon: Brain,
  },
];

export default function FeaturesSection() {
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) setActiveCard((c) => (c + 1) % 3);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => {
      clearInterval(interval);
      mountedRef.current = false;
    };
  }, []);

  const handleClick = (index: number) => {
    if (!mountedRef.current) return;
    setActiveCard(index);
    setProgress(0);
  };

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center">
        <div className="w-full max-w-[586px] flex flex-col items-center gap-4">
          <Badge
            icon={<div className="w-[10.5px] h-[10.5px] outline outline-[1.17px] outline-[#37322F] outline-offset-[-0.58px] rounded-full" />}
            text="Platform Features"
          />
          <div className="text-center text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Intelligence that works while you sleep
          </div>
          <div className="text-center text-[#605A57] text-base leading-7 font-sans">
            Every interaction is analyzed. Every relationship is scored.
            <br className="hidden sm:block" />
            You just search, connect, and grow.
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="self-stretch px-4 md:px-9 overflow-hidden flex justify-start items-center">
        <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
          {/* Feature Cards */}
          <div className="w-full md:w-auto md:max-w-[400px] flex flex-col gap-4 order-2 md:order-1">
            {features.map((feature, index) => {
              const isActive = index === activeCard;
              return (
                <div
                  key={index}
                  onClick={() => handleClick(index)}
                  className={`w-full overflow-hidden flex flex-col transition-all duration-300 cursor-pointer ${isActive ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]" : "border border-[rgba(2,6,23,0.08)]"}`}
                >
                  <div className={`w-full h-0.5 bg-[rgba(50,45,43,0.08)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}>
                    <div className="h-0.5 bg-[#37322F] transition-all duration-100 ease-linear" style={{ width: `${isActive ? progress : 0}%` }} />
                  </div>
                  <div className="px-6 py-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-4 w-4 text-[#7C3AED]" />
                      <span className="text-[#49423D] text-sm font-semibold leading-6 font-sans">{feature.title}</span>
                    </div>
                    <div className="text-[#605A57] text-[13px] leading-[22px] font-sans">{feature.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div className="w-full md:w-auto rounded-lg flex flex-col items-center gap-2 order-1 md:order-2">
            <div className="w-full md:w-[580px] h-[250px] md:h-[420px] bg-white shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] overflow-hidden rounded-lg relative">
              {/* Search Preview */}
              <div className={`absolute inset-0 p-6 md:p-8 flex flex-col gap-4 transition-all duration-500 ${activeCard === 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"}`}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">founders in fintech I met this year</span>
                </div>
                <div className="space-y-3 flex-1">
                  {[{ name: "Alex Rivera", role: "CEO, PayFlow", score: 82 }, { name: "Nina Patel", role: "Founder, BankOS", score: 67 }, { name: "James Liu", role: "CTO, LedgerAI", score: 54 }].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-[#E8E0F5] flex items-center justify-center text-xs font-medium text-[#7C3AED]">{r.name.split(" ").map(n => n[0]).join("")}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.role}</div>
                      </div>
                      <div className="text-xs font-medium text-[#7C3AED]">{r.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminder Preview */}
              <div className={`absolute inset-0 p-6 md:p-8 flex flex-col gap-4 transition-all duration-500 ${activeCard === 1 ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"}`}>
                <div className="text-sm font-medium text-gray-900">Due for check-in</div>
                <div className="space-y-3 flex-1">
                  {[{ name: "Sarah Kim", days: 45, freq: "Monthly" }, { name: "David Park", days: 32, freq: "Biweekly" }, { name: "Emma Wilson", days: 60, freq: "Quarterly" }].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/50">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-700">{r.name.split(" ").map(n => n[0]).join("")}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.days}d ago &middot; {r.freq}</div>
                      </div>
                      <Bell className="h-4 w-4 text-amber-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Research Preview */}
              <div className={`absolute inset-0 p-6 md:p-8 flex flex-col gap-4 transition-all duration-500 ${activeCard === 2 ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"}`}>
                <div className="flex items-center gap-2">
                  <Telescope className="h-4 w-4 text-[#7C3AED]" />
                  <span className="text-sm font-medium text-gray-900">AI Research Profile</span>
                </div>
                <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/30 space-y-3">
                  <div className="text-sm font-medium text-gray-900">Alex Rivera</div>
                  <div className="text-xs text-gray-600 leading-relaxed">Serial entrepreneur with 3 exits. Currently building PayFlow, a B2B payments platform. Previously VP Engineering at Stripe.</div>
                  <div className="flex flex-wrap gap-1">
                    {["Fintech", "Payments", "B2B SaaS", "YC W22"].map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] font-medium text-purple-700">{t}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Talking points:</div>
                  <div className="text-xs text-gray-600">Ask about PayFlow&apos;s Series B &middot; Shared interest in AI &middot; Both attended SaaStr 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
