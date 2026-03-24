"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SynapseLogo } from "@/components/synapse-logo";

function GoalSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <div className="border-t border-[#E5E5E3] pt-16 pb-20">
        <p className="text-[#AAAAAA] text-sm font-sans mb-8">{number}</p>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-1/2">
            <h2 className="text-[#1A1A1A] text-[28px] lg:text-[32px] font-normal leading-[1.2] font-serif mb-5">
              {title}
            </h2>
            <p className="text-[#888888] text-[16px] lg:text-[17px] leading-[1.65] font-sans max-w-[460px]">
              {description}
            </p>
          </div>
          <div className="lg:w-1/2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="pb-20 lg:pb-32">
        <h1 className="text-[#1A1A1A] text-[32px] sm:text-[40px] lg:text-[48px] font-normal leading-[1.12] font-serif mb-10 lg:mb-14 max-w-[520px]">
          Bringing the AI
          <br />
          to Human Life
        </h1>
        <div className="max-w-[480px] flex flex-col gap-5">
          <p className="text-[#888888] text-[15px] lg:text-[16px] leading-[1.7] font-sans">
            We believe in a future where computers are lifelike. They will
            see, hear, and collaborate with us the way we&apos;re used to. A
            natural human voice is key to unlocking this future.
          </p>
          <p className="text-[#1A1A1A] text-[15px] lg:text-[16px] leading-[1.7] font-sans font-medium">
            To start, we have two goals.
          </p>
        </div>
      </section>

      {/* Goal 01 — Hardware */}
      <GoalSection
        number="01"
        title="Wearable companions"
        description="Discreet devices designed to be worn all day — a pendant that captures conversations and spectacles that surface context in real time. Always listening, never intrusive."
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-lg"
        >
          <source src="/synapse-hero.mp4" type="video/mp4" />
          <source src="/synapse-hero.mov" type="video/quicktime" />
        </video>
      </GoalSection>

      {/* Goal 02 — Voice */}
      <GoalSection
        number="02"
        title="A proactive relationship agent"
        description="An ever-present companion that remembers every conversation, anticipates who you should reach out to, and helps you show up prepared."
      >
        <img
          src="/synapse-pendant.jpeg"
          alt="Synapse Pendant"
          className="w-full rounded-lg"
        />
      </GoalSection>

      {/* Goal 03 — Infrastructure */}
      <GoalSection
        number="03"
        title="The relationship layer for AI apps"
        description="APIs and SDKs that give any application access to relationship intelligence — contact enrichment, network graphs, and interaction memory at scale."
      >
        <div className="w-full rounded-lg bg-[#1A1A1A] p-5 overflow-hidden">
          <pre className="text-[13px] leading-[1.7] font-mono overflow-x-auto">
            <code>
              <span className="text-[#888888]">{"const "}</span>
              <span className="text-[#E5E5E3]">synapse</span>
              <span className="text-[#888888]">{" = new "}</span>
              <span className="text-[#E5E5E3]">{"Synapse({ "}</span>
              <span className="text-[#888888]">apiKey</span>
              <span className="text-[#E5E5E3]">{': "sk_..."'}</span>
              <span className="text-[#E5E5E3]">{" });"}</span>
              {"\n\n"}
              <span className="text-[#888888]">{"const "}</span>
              <span className="text-[#E5E5E3]">contact</span>
              <span className="text-[#888888]">{" = await "}</span>
              <span className="text-[#E5E5E3]">
                {"synapse.contacts.enrich({"}
              </span>
              {"\n"}
              <span className="text-[#E5E5E3]">
                {"  "}
              </span>
              <span className="text-[#888888]">email</span>
              <span className="text-[#E5E5E3]">
                {': "jane@company.com"'}
              </span>
              {"\n"}
              <span className="text-[#E5E5E3]">{"});"}</span>
              {"\n\n"}
              <span className="text-[#555555]">
                {"// → { name, company, score, lastInteraction, ... }"}
              </span>
            </code>
          </pre>
        </div>
      </GoalSection>

      {/* Join Section */}
      <section className="border-t border-[#E5E5E3] pt-16 pb-20 lg:pb-32">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-1/2">
            <h2 className="text-[#1A1A1A] text-[28px] lg:text-[32px] font-normal leading-[1.2] font-serif mb-5">
              Join Synapse
            </h2>
            <p className="text-[#888888] text-[16px] lg:text-[17px] leading-[1.65] font-sans max-w-[460px]">
              Synapse is an interdisciplinary team building the relationship
              layer for human connection. Learn more about our{" "}
              <Link
                href="/team"
                className="text-[#1A1A1A] underline underline-offset-4 decoration-[#E5E5E3] hover:decoration-[#1A1A1A] transition-colors duration-200"
              >
                team and mission
              </Link>
              .
            </p>
          </div>
          <div className="lg:w-1/2 flex flex-col gap-6">
            <div className="relative w-full max-w-[320px]">
              <div className="w-[200px] sm:w-[240px] h-[140px] sm:h-[170px] rounded-lg bg-[#EAEAE8] flex items-center justify-center">
                <p className="text-[#AAAAAA] text-sm font-sans">Team</p>
              </div>
              <div className="w-[200px] sm:w-[240px] h-[140px] sm:h-[170px] rounded-lg bg-[#E0E0DE] flex items-center justify-center absolute top-4 left-10 sm:top-5 sm:left-14">
                <p className="text-[#AAAAAA] text-sm font-sans">Team</p>
              </div>
            </div>
            <Link
              href="https://jobs.ashbyhq.com/synapse"
              className="inline-flex items-center gap-2 text-[#1A1A1A] text-[15px] font-sans mt-8 group"
            >
              <span className="underline underline-offset-4 decoration-[#E5E5E3] group-hover:decoration-[#1A1A1A] transition-colors duration-200">
                Careers at Synapse
              </span>
              <ArrowUpRight
                size={16}
                className="text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors duration-200"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E3] py-10 pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <SynapseLogo className="h-7 w-7" />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex gap-6">
              <Link href="/" className="text-[#888888] text-[14px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Home</Link>
              <Link href="/research" className="text-[#888888] text-[14px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Research</Link>
              <Link href="/team" className="text-[#888888] text-[14px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Team</Link>
              <a href="mailto:info@wearsynapse.com" className="text-[#888888] text-[14px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Contact us</a>
            </div>
            <div className="flex gap-5">
              <a href="https://x.com/synapse" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com/company/synapse" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="https://discord.gg/synapse" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#1A1A1A] transition-colors duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-10 gap-4">
          <p className="text-[#AAAAAA] text-[13px] font-sans">
            Copyright &copy; 2026 Synapse AI Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[#AAAAAA] text-[13px] font-sans hover:text-[#888888] transition-colors duration-200">Privacy</Link>
            <Link href="/terms" className="text-[#AAAAAA] text-[13px] font-sans hover:text-[#888888] transition-colors duration-200">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
