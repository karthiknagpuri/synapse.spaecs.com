"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingSection() {
  const [period, setPeriod] = useState<"annually" | "monthly">("annually");

  const pricing = {
    starter: { monthly: 0, annually: 0 },
    pro: { monthly: 29, annually: 24 },
    team: { monthly: 79, annually: 64 },
  };

  const CheckIcon = ({ color = "#9CA3AF" }: { color?: string }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 3L4.5 8.5L2 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="w-full flex flex-col justify-center items-center gap-2">
      {/* Header */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center">
        <div className="w-full max-w-[586px] flex flex-col justify-start items-center gap-4">
          <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] rounded-[90px] flex items-center gap-2 border border-[rgba(2,6,23,0.08)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M8.5 3H4.75C4.286 3 3.841 3.184 3.513 3.513C3.184 3.841 3 4.286 3 4.75C3 5.214 3.184 5.659 3.513 5.987C3.841 6.316 4.286 6.5 4.75 6.5H7.25C7.714 6.5 8.159 6.684 8.487 7.013C8.816 7.341 9 7.786 9 8.25C9 8.714 8.816 9.159 8.487 9.487C8.159 9.816 7.714 10 7.25 10H3.5" stroke="#37322F" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#37322F] text-xs font-medium font-sans">Plans & Pricing</span>
          </div>
          <div className="text-center text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Simple pricing, powerful relationships
          </div>
          <div className="text-center text-[#605A57] text-base leading-7 font-sans">
            Start free. Upgrade when your network demands it.
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="self-stretch px-6 md:px-16 py-9 relative flex justify-center items-center">
        <div className="w-full max-w-[1060px] h-0 absolute left-1/2 -translate-x-1/2 top-[63px] border-t border-[rgba(55,50,47,0.12)] z-0" />
        <div className="p-3 relative bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.02)] backdrop-blur-[44px] flex justify-center items-center rounded-lg z-20 before:absolute before:inset-0 before:bg-white before:opacity-60 before:rounded-lg before:-z-10">
          <div className="p-[2px] bg-[rgba(55,50,47,0.10)] shadow-[0px_1px_0px_white] rounded-[99px] border-[0.5px] border-[rgba(55,50,47,0.08)] flex justify-center items-center gap-[2px] relative">
            <div className={`absolute top-[2px] w-[calc(50%-1px)] h-[calc(100%-4px)] bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.08)] rounded-[99px] transition-all duration-300 ease-in-out ${period === "annually" ? "left-[2px]" : "right-[2px]"}`} />
            <button onClick={() => setPeriod("annually")} className="px-4 py-1 rounded-[99px] flex justify-center items-center relative z-10">
              <span className={`text-[13px] font-medium leading-5 font-sans transition-colors duration-300 ${period === "annually" ? "text-[#37322F]" : "text-[#6B7280]"}`}>Annually</span>
            </button>
            <button onClick={() => setPeriod("monthly")} className="px-4 py-1 rounded-[99px] flex justify-center items-center relative z-10">
              <span className={`text-[13px] font-medium leading-5 font-sans transition-colors duration-300 ${period === "monthly" ? "text-[#37322F]" : "text-[#6B7280]"}`}>Monthly</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="self-stretch border-b border-t border-[rgba(55,50,47,0.12)] flex justify-center items-center">
        <div className="flex justify-center items-start w-full">
          <div className="w-12 self-stretch relative overflow-hidden hidden md:block">
            <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col">
              {Array.from({ length: 200 }).map((_, i) => (
                <div key={i} className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-6 py-12 md:py-0">
            {/* Starter */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 border border-[#E0DEDB] flex flex-col gap-12 bg-transparent">
              <div className="flex flex-col gap-9">
                <div className="flex flex-col gap-2">
                  <div className="text-[rgba(55,50,47,0.90)] text-lg font-medium leading-7 font-sans">Free</div>
                  <div className="max-w-[242px] text-[rgba(41,37,35,0.70)] text-sm leading-5 font-sans">For individuals getting started with smarter networking.</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="relative h-[60px] flex items-center text-[#37322F] text-5xl font-medium leading-[60px] font-serif">$0</div>
                  <div className="text-[#847971] text-sm font-medium font-sans">Free forever</div>
                </div>
                <Link href="/login" className="self-stretch px-4 py-[10px] relative bg-[#37322F] rounded-[99px] flex justify-center items-center">
                  <span className="text-[#FBFAF9] text-[13px] font-medium leading-5 font-sans">Get started</span>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {["Up to 250 contacts", "Gmail & Calendar sync", "Natural language search", "Basic relationship scores", "LinkedIn CSV import"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center"><CheckIcon /></div>
                    <span className="text-[rgba(55,50,47,0.80)] text-[12.5px] leading-5 font-sans">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 bg-[#37322F] border border-[rgba(55,50,47,0.12)] flex flex-col gap-12">
              <div className="flex flex-col gap-9">
                <div className="flex flex-col gap-2">
                  <div className="text-[#FBFAF9] text-lg font-medium leading-7 font-sans">Pro</div>
                  <div className="max-w-[242px] text-[#B2AEA9] text-sm leading-5 font-sans">For professionals who live and breathe their network.</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="relative h-[60px] flex items-center text-[#F0EFEE] text-5xl font-medium leading-[60px] font-serif">
                    <span className="invisible">${pricing.pro[period]}</span>
                    <span className="absolute inset-0 flex items-center transition-all duration-500" style={{ opacity: period === "annually" ? 1 : 0, transform: `scale(${period === "annually" ? 1 : 0.8})`, filter: `blur(${period === "annually" ? 0 : 4}px)` }}>${pricing.pro.annually}</span>
                    <span className="absolute inset-0 flex items-center transition-all duration-500" style={{ opacity: period === "monthly" ? 1 : 0, transform: `scale(${period === "monthly" ? 1 : 0.8})`, filter: `blur(${period === "monthly" ? 0 : 4}px)` }}>${pricing.pro.monthly}</span>
                  </div>
                  <div className="text-[#D2C6BF] text-sm font-medium font-sans">per {period === "monthly" ? "month" : "year"}</div>
                </div>
                <Link href="/login" className="self-stretch px-4 py-[10px] relative bg-[#FBFAF9] rounded-[99px] flex justify-center items-center">
                  <span className="text-[#37322F] text-[13px] font-medium leading-5 font-sans">Start free trial</span>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {["Unlimited contacts", "AI relationship intelligence", "Stay-in-touch reminders", "AI-powered research profiles", "Pipeline management", "Auto-tagging & enrichment", "Fading relationship alerts", "Priority support"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center"><CheckIcon color="#7C3AED" /></div>
                    <span className="text-[#F0EFEE] text-[12.5px] leading-5 font-sans">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 bg-white border border-[#E0DEDB] flex flex-col gap-12">
              <div className="flex flex-col gap-9">
                <div className="flex flex-col gap-2">
                  <div className="text-[rgba(55,50,47,0.90)] text-lg font-medium leading-7 font-sans">Team</div>
                  <div className="max-w-[242px] text-[rgba(41,37,35,0.70)] text-sm leading-5 font-sans">For teams that close deals through relationships.</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="relative h-[60px] flex items-center text-[#37322F] text-5xl font-medium leading-[60px] font-serif">
                    <span className="invisible">${pricing.team[period]}</span>
                    <span className="absolute inset-0 flex items-center transition-all duration-500" style={{ opacity: period === "annually" ? 1 : 0, transform: `scale(${period === "annually" ? 1 : 0.8})`, filter: `blur(${period === "annually" ? 0 : 4}px)` }}>${pricing.team.annually}</span>
                    <span className="absolute inset-0 flex items-center transition-all duration-500" style={{ opacity: period === "monthly" ? 1 : 0, transform: `scale(${period === "monthly" ? 1 : 0.8})`, filter: `blur(${period === "monthly" ? 0 : 4}px)` }}>${pricing.team.monthly}</span>
                  </div>
                  <div className="text-[#847971] text-sm font-medium font-sans">per {period === "monthly" ? "month" : "year"}, per seat</div>
                </div>
                <Link href="/login" className="self-stretch px-4 py-[10px] relative bg-[#37322F] rounded-[99px] flex justify-center items-center">
                  <span className="text-[#FBFAF9] text-[13px] font-medium leading-5 font-sans">Contact us</span>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {["Everything in Pro", "Shared network graph", "Team pipeline views", "Admin controls & SSO", "Dedicated account manager", "Custom integrations", "API access", "SLA & priority support"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center"><CheckIcon /></div>
                    <span className="text-[rgba(55,50,47,0.80)] text-[12.5px] leading-5 font-sans">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-12 self-stretch relative overflow-hidden hidden md:block">
            <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col">
              {Array.from({ length: 200 }).map((_, i) => (
                <div key={i} className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
