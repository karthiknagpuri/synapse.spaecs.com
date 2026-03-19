import Link from "next/link";

export default function CTASection() {
  return (
    <div className="w-full relative overflow-hidden flex flex-col justify-center items-center">
      <div className="self-stretch px-6 md:px-24 py-12 border-t border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center relative z-10">
        {/* Hatched background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-4 w-full rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                style={{ top: `${i * 16 - 120}px`, left: "-100%", width: "300%" }}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-[586px] px-6 py-5 md:py-8 rounded-lg flex flex-col justify-start items-center gap-6 relative z-20">
          <div className="flex flex-col gap-3">
            <div className="text-center text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[56px] font-sans tracking-tight whitespace-nowrap">
              Your network is your net worth
            </div>
            <div className="text-center text-[#605A57] text-base leading-7 font-sans font-medium">
              Follow up. Retain. Nurture.
            </div>
          </div>
          <Link
            href="/login"
            className="h-10 px-12 py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] rounded-full flex justify-center items-center hover:bg-[#2A2520] transition-colors"
          >
            <span className="text-white text-[13px] font-medium leading-5 font-sans">Get started free</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
