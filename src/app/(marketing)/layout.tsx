"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SynapseLogo } from "@/components/synapse-logo";
import { ReserveDeviceModal } from "@/components/reserve-device-modal";
import { cn } from "@/lib/utils";

const RESERVE_SEEN_KEY = "synapse_reserve_seen";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;
    if (window.localStorage.getItem(RESERVE_SEEN_KEY)) return;
    const t = window.setTimeout(() => setReserveOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const closeReserve = () => {
    setReserveOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RESERVE_SEEN_KEY, "1");
    }
  };

  const openWaitlist = () => {
    setMobileMenuOpen(false);
    setReserveOpen(true);
  };

  const navLinks = [
    { href: "/", label: "Synapse" },
    { href: "/research", label: "Research" },
    { href: "/product", label: "Product" },
    { href: "/team", label: "Team" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <ReserveDeviceModal open={reserveOpen} onClose={closeReserve} />

      {/* Mobile Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#F5F5F3]/95 backdrop-blur-sm border-b border-[#E5E5E3]">
        <div className="flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <SynapseLogo className="h-6 w-6" />
            <span className="text-[#1A1A1A] text-[15px] font-semibold font-sans">
              Synapse
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#1A1A1A]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="px-6 pb-8 pt-2 flex flex-col gap-5 bg-[#F5F5F3] border-b border-[#E5E5E3]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[15px] font-sans transition-colors duration-200",
                  pathname === link.href
                    ? "text-[#1A1A1A] font-medium"
                    : "text-[#888888] hover:text-[#1A1A1A]"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#E5E5E3] pt-5 flex flex-col gap-4 items-start">
              <Link
                href="/preview"
                className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Try Demo
              </Link>
              <button
                type="button"
                onClick={openWaitlist}
                className="px-4 py-2 bg-[#1A1A1A] text-white text-[14px] font-sans font-medium rounded-full hover:bg-[#333333] transition-colors duration-200"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar Nav */}
        <nav className="hidden lg:flex flex-col fixed right-0 top-0 h-screen w-[220px] pt-[120px] pl-6 pr-10">
          <Link href="/" className="mb-8">
            <SynapseLogo className="h-8 w-8" />
          </Link>
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[15px] font-sans transition-colors duration-200",
                  pathname === link.href
                    ? "text-[#1A1A1A] font-semibold"
                    : "text-[#888888] hover:text-[#1A1A1A]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-[#E5E5E3] mt-6 pt-6 flex flex-col gap-4 items-start">
            <Link
              href="/preview"
              className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
            >
              Try Demo
            </Link>
            <button
              type="button"
              onClick={openWaitlist}
              className="px-4 py-2 bg-[#1A1A1A] text-white text-[14px] font-sans font-medium rounded-full hover:bg-[#333333] transition-colors duration-200"
            >
              Join Waitlist
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-auto lg:mr-[220px] px-5 sm:px-10 lg:px-10 xl:px-14 pt-20 lg:pt-[120px] w-full max-w-[860px]">
          {children}
        </main>
      </div>
    </div>
  );
}
