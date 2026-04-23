"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="border-t border-[#E5E5E3] pt-5 lg:pt-6 pb-20">
        <p className="text-[#AAAAAA] text-sm font-sans mb-4">{number}</p>
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
      <section className="pb-3 lg:pb-4">
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
            To start, we have three goals.
          </p>
        </div>
      </section>

      {/* Press */}
      <section className="border-t border-[#E5E5E3] pt-10 pb-10 lg:pt-12 lg:pb-12">
        <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-[0.14em] mb-6">
          As seen on
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              publisher: "The Economic Times",
              title:
                "Y Combinator\u2019s first Startup School event in India helps techies land jobs, gigs",
              url: "https://economictimes.indiatimes.com/tech/technology/y-combinators-first-startup-school-event-in-india-helps-techies-land-jobs-gigs-but/articleshow/130372140.cms",
            },
            {
              publisher: "Hindustan Times",
              title:
                "Only in Bengaluru: security guard at YC event pitches product to Harvard-educated entrepreneur",
              url: "https://www.hindustantimes.com/trending/only-in-bengaluru-security-guard-at-yc-event-pitches-product-to-harvard-educated-entrepreneur-101776573400084.html",
            },
            {
              publisher: "News Karnataka",
              title:
                "Security guard steals spotlight at YC Bengaluru event",
              url: "https://newskarnataka.com/bengaluru/security-guard-steals-spotlight-at-yc-bengaluru-event/21042026",
            },
          ].map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-lg border border-[#E5E5E3] bg-white px-4 py-4 hover:border-[#AAAAAA] transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-serif text-[#1A1A1A] leading-none">
                  {item.publisher}
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors duration-200 shrink-0"
                />
              </div>
              <p className="text-[12px] font-sans text-[#888888] leading-[1.5] line-clamp-3">
                {item.title}
              </p>
            </a>
          ))}
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
        <Image
          src="/synapse-pendant.jpeg"
          alt="Synapse Pendant"
          width={960}
          height={640}
          className="w-full h-auto rounded-lg"
        />
      </GoalSection>

      {/* Goal 03 — Infrastructure */}
      <GoalSection
        number="03"
        title="The Voice Hardware Infra for AI Apps"
        description="APIs and SDKs that give any application access to voice hardware — always-on capture, on-device transcription, and conversational memory at scale."
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
              <div className="w-[200px] sm:w-[240px] h-[140px] sm:h-[170px] rounded-lg bg-[#EAEAE8]" aria-hidden="true" />
              <div className="w-[200px] sm:w-[240px] h-[140px] sm:h-[170px] rounded-lg overflow-hidden absolute top-4 left-10 sm:top-5 sm:left-14 ring-4 ring-[#F5F5F3] shadow-sm">
                <Image
                  src="/team-group.jpeg"
                  alt="Synapse team"
                  width={480}
                  height={340}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-8">
              <a
                href="mailto:human@wearsynapse.com"
                className="inline-flex items-center gap-2 text-[#1A1A1A] text-[15px] font-sans group"
              >
                <span className="underline underline-offset-4 decoration-[#E5E5E3] group-hover:decoration-[#1A1A1A] transition-colors duration-200">
                  Write at human@wearsynapse.com
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors duration-200"
                />
              </a>
              <a
                href="mailto:wearsynapse@gmail.com"
                className="inline-flex items-center gap-2 text-[#888888] text-[13px] font-sans group"
              >
                <span className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider">
                  Secondary
                </span>
                <span className="underline underline-offset-4 decoration-[#E5E5E3] group-hover:decoration-[#888888] transition-colors duration-200">
                  wearsynapse@gmail.com
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E3] pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <SynapseLogo className="h-7 w-7" />
              <span className="text-[#1A1A1A] text-[16px] font-serif tracking-tight">Synapse</span>
            </div>
            <p className="text-[#888888] text-[13px] font-sans leading-[1.6] max-w-[260px]">
              The relationship layer for human connection.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[#1A1A1A] text-[12px] font-sans font-medium uppercase tracking-[0.08em]">Product</p>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Home</Link></li>
              <li><Link href="/preview" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Preview</Link></li>
              <li><Link href="/research" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Research</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[#1A1A1A] text-[12px] font-sans font-medium uppercase tracking-[0.08em]">Company</p>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/team" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Team</Link></li>
              <li><a href="mailto:human@wearsynapse.com" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Contact</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[#1A1A1A] text-[12px] font-sans font-medium uppercase tracking-[0.08em]">Legal</p>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/privacy" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Privacy</Link></li>
              <li><Link href="/terms" className="text-[#888888] text-[13px] font-sans hover:text-[#1A1A1A] transition-colors duration-200">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E5E5E3] mt-14 pt-6">
          <p className="text-[#AAAAAA] text-[12px] font-sans">
            &copy; 2026 Synapse AI Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
