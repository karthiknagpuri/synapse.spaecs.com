import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ProductPage() {
  return (
    <div className="pb-24">
      <h1 className="text-[#1A1A1A] text-[36px] sm:text-[48px] font-normal leading-[1.1] font-serif mb-8">
        Product
      </h1>

      <p className="text-[#888888] text-[17px] leading-[1.65] font-sans mb-12 max-w-[520px]">
        Wearable hardware and an open platform that brings AI into your
        everyday life — privately, intelligently, and on your terms.
      </p>

      {/* 01 — Intelligence */}
      <div className="border-t border-[#E5E5E3] pt-12 mb-16">
        <p className="text-[#AAAAAA] text-sm font-sans mb-2 uppercase tracking-wider">
          01 — Intelligence
        </p>
        <h2 className="text-[#1A1A1A] text-[28px] sm:text-[32px] font-normal leading-[1.2] font-serif mb-5">
          Your AI &middot; Your Rules
        </h2>
        <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-8 max-w-[520px]">
          Habit tracking, health monitoring, meeting summaries, and public
          speaking coaching. All processed locally with client-side encryption.
        </p>
        <div className="flex flex-wrap gap-6 sm:gap-12 mb-8">
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Spec
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">
              10,000+ apps
            </p>
          </div>
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Feature
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">
              Private by default
            </p>
          </div>
        </div>
      </div>

      {/* 02 — Platform */}
      <div className="border-t border-[#E5E5E3] pt-12 mb-16">
        <p className="text-[#AAAAAA] text-sm font-sans mb-2 uppercase tracking-wider">
          02 — Platform
        </p>
        <h2 className="text-[#1A1A1A] text-[28px] sm:text-[32px] font-normal leading-[1.2] font-serif mb-5">
          Build Anything
        </h2>
        <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-8 max-w-[520px]">
          Developer SDK, AI app store, and support for all major AI models.
          Join the community building the future of personal AI.
        </p>
        <div className="flex flex-wrap gap-6 sm:gap-12 mb-8">
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Spec
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">Open SDK</p>
          </div>
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Feature
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">
              All AI models
            </p>
          </div>
        </div>
      </div>

      {/* 03 — Privacy */}
      <div className="border-t border-[#E5E5E3] pt-12 mb-16">
        <p className="text-[#AAAAAA] text-sm font-sans mb-2 uppercase tracking-wider">
          03 — Privacy
        </p>
        <h2 className="text-[#1A1A1A] text-[28px] sm:text-[32px] font-normal leading-[1.2] font-serif mb-5">
          Zero Tracking
        </h2>
        <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-8 max-w-[520px]">
          Client-side encryption means your data never leaves your device.
          Open-source hardware you can trust, with no tracking or surveillance.
        </p>
        <div className="flex flex-wrap gap-6 sm:gap-12 mb-8">
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Spec
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">
              End-to-end encrypted
            </p>
          </div>
          <div>
            <p className="text-[#AAAAAA] text-[11px] font-sans uppercase tracking-wider mb-1">
              Feature
            </p>
            <p className="text-[#1A1A1A] text-[15px] font-sans">Open source</p>
          </div>
        </div>
        <img
          src="/synapse-pendant.jpeg"
          alt="Synapse Pendant"
          className="w-full max-w-[480px] rounded-lg"
        />
      </div>

      {/* Join Waitlist */}
      <div className="border-t border-[#E5E5E3] pt-12">
        <h2 className="text-[#1A1A1A] text-[24px] font-normal leading-[1.3] font-serif mb-5">
          Get early access
        </h2>
        <p className="text-[#888888] text-[16px] leading-[1.65] font-sans mb-6 max-w-[520px]">
          Synapse is currently in development. Join the waitlist to be among the
          first to experience the future of personal AI.
        </p>
        <Link
          href="/beta"
          className="inline-flex items-center gap-2 text-[#1A1A1A] text-[15px] font-sans group"
        >
          <span className="underline underline-offset-4 decoration-[#E5E5E3] group-hover:decoration-[#1A1A1A] transition-colors duration-200">
            Join Waitlist
          </span>
          <ArrowUpRight
            size={16}
            className="text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors duration-200"
          />
        </Link>
      </div>
    </div>
  );
}
