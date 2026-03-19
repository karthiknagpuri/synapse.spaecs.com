"use client";

import { useState } from "react";

const faqData = [
  {
    question: "What is Synapse and who is it for?",
    answer: "Synapse is an AI-powered relationship intelligence platform for professionals, founders, investors, and salespeople. It unifies your Gmail, Calendar, and LinkedIn contacts into one searchable network with AI-powered insights, relationship scoring, and proactive reminders.",
  },
  {
    question: "How does natural language search work?",
    answer: "Type queries like \"VCs in San Francisco I met last quarter\" or \"engineers who worked at Google.\" Our AI uses semantic understanding to search across all your contacts, interactions, and notes — then explains exactly why each person matched.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. We use read-only access for Gmail and Calendar. Your data is encrypted at rest and in transit. We never sell your data or share it with third parties. You can export or delete all your data at any time.",
  },
  {
    question: "What integrations do you support?",
    answer: "Synapse connects with Gmail, Google Calendar, and LinkedIn (via CSV import). We're actively building integrations for Outlook, Twitter/X, WhatsApp, and Slack. Our API allows custom integrations for Pro and Team plans.",
  },
  {
    question: "How does relationship scoring work?",
    answer: "Our algorithm considers interaction recency, frequency, diversity of touchpoints, and engagement quality. Scores update automatically as you communicate. You'll see contacts categorized from New to Inner Circle, with alerts when relationships start fading.",
  },
  {
    question: "Can I try Synapse before committing?",
    answer: "Yes. Our Free plan includes up to 250 contacts with full search and basic scoring — no credit card required. Pro plans include a 14-day free trial so you can experience the full AI intelligence layer before deciding.",
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]);
  };

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="text-[#49423D] text-4xl font-semibold leading-tight font-sans tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="text-[#605A57] text-base leading-7 font-sans">
            Everything you need to know about
            <br className="hidden md:block" />
            managing your network with Synapse.
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:flex-1 flex flex-col">
          {faqData.map((item, index) => {
            const isOpen = openItems.includes(index);
            return (
              <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">{item.question}</div>
                  <svg
                    className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    width="24" height="24" viewBox="0 0 24 24" fill="none"
                  >
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-5 pb-[18px] text-[#605A57] text-sm leading-6 font-sans">{item.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
