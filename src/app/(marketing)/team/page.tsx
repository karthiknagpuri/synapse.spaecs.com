import { ArrowUpRight } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="pb-24">
      <h1 className="text-[#1A1A1A] text-[36px] sm:text-[48px] font-normal leading-[1.1] font-serif mb-8">
        Team
      </h1>

      <p className="text-[#888888] text-[17px] leading-[1.65] font-sans mb-6 max-w-[520px]">
        Synapse is built by an interdisciplinary team of engineers,
        researchers, and designers who believe that a small, focused group with
        a clear vision can build great things.
      </p>

      <p className="text-[#888888] text-[17px] leading-[1.65] font-sans mb-12 max-w-[520px]">
        We combine expertise in hardware, machine learning, and product design
        to create tools that make human relationships more intentional and
        lasting.
      </p>

      <div className="border-t border-[#E5E5E3] pt-12 mb-12">
        <h2 className="text-[#1A1A1A] text-[24px] font-normal leading-[1.3] font-serif mb-6">
          Our mission
        </h2>
        <p className="text-[#888888] text-[17px] leading-[1.65] font-sans max-w-[520px]">
          In a world of infinite connections and shallow interactions, we
          believe the deepest human need is to be truly known. Synapse exists
          to build the intelligence layer that helps people maintain meaningful
          relationships at scale — without losing the personal touch that makes
          each connection valuable.
        </p>
      </div>

      <div className="border-t border-[#E5E5E3] pt-12 mb-12">
        <h2 className="text-[#1A1A1A] text-[24px] font-normal leading-[1.3] font-serif mb-6">
          Based in
        </h2>
        <p className="text-[#888888] text-[17px] leading-[1.65] font-sans">
          India
        </p>
      </div>

      <div className="border-t border-[#E5E5E3] pt-12">
        <h2 className="text-[#1A1A1A] text-[24px] font-normal leading-[1.3] font-serif mb-6">
          Join us
        </h2>
        <p className="text-[#888888] text-[17px] leading-[1.65] font-sans mb-6 max-w-[520px]">
          We&apos;re looking for people who care deeply about human connection and
          want to build technology that amplifies it.
        </p>
        <a
          href="mailto:careers@wearsynapse.com"
          className="inline-flex items-center gap-2 text-[#1A1A1A] text-[15px] font-sans group"
        >
          <span className="underline underline-offset-4 decoration-[#E5E5E3] group-hover:decoration-[#1A1A1A] transition-colors duration-200">
            Careers at Synapse
          </span>
          <ArrowUpRight
            size={16}
            className="text-[#AAAAAA] group-hover:text-[#1A1A1A] transition-colors duration-200"
          />
        </a>
      </div>
    </div>
  );
}
