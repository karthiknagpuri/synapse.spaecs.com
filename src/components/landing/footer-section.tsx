import Link from "next/link";
import Image from "next/image";

export default function FooterSection() {
  return (
    <div className="w-full pt-10 flex flex-col justify-start items-start">
      <div className="self-stretch flex flex-col md:flex-row justify-between items-stretch pb-8">
        {/* Brand */}
        <div className="p-4 md:p-8 flex flex-col justify-start items-start gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#0A0A0A]">
              <Image src="/synapse-logo.png" alt="Synapse" width={18} height={18} />
            </div>
            <span className="text-[#49423D] text-xl font-semibold leading-4 font-sans">Synapse</span>
          </div>
          <div className="text-[rgba(73,66,61,0.90)] text-sm font-medium leading-[18px] font-sans">
            Your network, searchable.
          </div>
          {/* Social */}
          <div className="flex items-start gap-4">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#49423D" />
              </svg>
            </div>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" fill="#49423D" />
              </svg>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="p-4 md:p-8 flex flex-col sm:flex-row flex-wrap justify-start sm:justify-between items-start gap-6 md:gap-8">
          <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
            <div className="text-[rgba(73,66,61,0.50)] text-sm font-medium leading-5 font-sans">Product</div>
            <div className="flex flex-col gap-2">
              {["Features", "Pricing", "Integrations", "Search", "Research"].map((item) => (
                <div key={item} className="text-[#49423D] text-sm leading-5 font-sans cursor-pointer hover:text-[#37322F] transition-colors">{item}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
            <div className="text-[rgba(73,66,61,0.50)] text-sm font-medium leading-5 font-sans">Company</div>
            <div className="flex flex-col gap-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <div key={item} className="text-[#49423D] text-sm leading-5 font-sans cursor-pointer hover:text-[#37322F] transition-colors">{item}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-[120px]">
            <div className="text-[rgba(73,66,61,0.50)] text-sm font-medium leading-5 font-sans">Legal</div>
            <div className="flex flex-col gap-2">
              {["Privacy Policy", "Terms of Service", "Security", "GDPR"].map((item) => (
                <div key={item} className="text-[#49423D] text-sm leading-5 font-sans cursor-pointer hover:text-[#37322F] transition-colors">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom pattern bar */}
      <div className="self-stretch h-12 relative overflow-hidden border-t border-b border-[rgba(55,50,47,0.12)]">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 400 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[300px] h-16 border border-[rgba(3,7,18,0.08)]"
                style={{ left: `${i * 300 - 600}px`, top: "-120px", transform: "rotate(-45deg)", transformOrigin: "top left" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
