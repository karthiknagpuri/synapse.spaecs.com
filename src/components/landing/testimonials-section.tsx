"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    quote:
      "Synapse found a warm intro path to my Series A lead investor through someone I hadn't spoken to in months. That connection closed our round.",
    name: "Priya Sharma",
    company: "Founder, NeuralStack",
    initials: "PS",
  },
  {
    quote:
      "I used to forget follow-ups constantly. Now Synapse reminds me exactly when to reach out and even tells me what to say. My network has never been stronger.",
    name: "Marcus Chen",
    company: "VP Sales, Lattice",
    initials: "MC",
  },
  {
    quote:
      "We searched 'engineers who worked at Stripe and live in London' and got results in seconds. The AI explanations for each match are incredibly helpful.",
    name: "Amara Osei",
    company: "Head of Talent, Runway",
    initials: "AO",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % testimonials.length);
        setTimeout(() => setTransitioning(false), 100);
      }, 300);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (index: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setActive(index);
      setTimeout(() => setTransitioning(false), 100);
    }, 300);
  };

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      <div className="self-stretch px-2 overflow-hidden flex justify-start items-center">
        <div className="flex-1 py-16 md:py-20 flex flex-col md:flex-row justify-center items-end gap-6">
          <div className="self-stretch px-4 md:px-12 justify-center items-start gap-6 flex flex-col md:flex-row">
            {/* Avatar */}
            <div
              className="w-48 h-52 rounded-lg flex items-center justify-center shrink-0 transition-all duration-700 ease-in-out"
              style={{
                backgroundColor: active === 0 ? "#E8E0F5" : active === 1 ? "#DDE8F0" : "#E0ECE4",
                opacity: transitioning ? 0.6 : 1,
                transform: transitioning ? "scale(0.95)" : "scale(1)",
              }}
            >
              <span
                className="text-5xl font-medium font-serif transition-all duration-700"
                style={{
                  color: active === 0 ? "#7C3AED" : active === 1 ? "#2563EB" : "#059669",
                  filter: transitioning ? "blur(4px)" : "blur(0px)",
                }}
              >
                {testimonials[active].initials}
              </span>
            </div>

            {/* Quote */}
            <div className="flex-1 px-2 md:px-6 py-2 flex flex-col justify-start items-start gap-6">
              <div
                className="self-stretch text-[#49423D] text-xl sm:text-2xl md:text-[32px] font-medium leading-8 md:leading-[42px] font-sans tracking-tight min-h-[168px] md:min-h-[210px] transition-all duration-700 ease-in-out"
                style={{ filter: transitioning ? "blur(4px)" : "blur(0px)" }}
              >
                &ldquo;{testimonials[active].quote}&rdquo;
              </div>
              <div
                className="self-stretch flex flex-col gap-1 transition-all duration-700 ease-in-out"
                style={{ filter: transitioning ? "blur(4px)" : "blur(0px)" }}
              >
                <div className="text-[rgba(73,66,61,0.90)] text-lg font-medium leading-[26px] font-sans">
                  {testimonials[active].name}
                </div>
                <div className="text-[rgba(73,66,61,0.70)] text-base font-medium leading-[26px] font-sans">
                  {testimonials[active].company}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pr-6 justify-start items-start gap-3 flex">
            <button
              onClick={() => navigate((active - 1 + testimonials.length) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] justify-center items-center flex hover:bg-gray-50 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="#46413E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => navigate((active + 1) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] justify-center items-center flex hover:bg-gray-50 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#46413E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
