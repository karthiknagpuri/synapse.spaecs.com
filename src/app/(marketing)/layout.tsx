"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SynapseLogo } from "@/components/synapse-logo";
import { cn } from "@/lib/utils";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Synapse" },
    { href: "/research", label: "Research" },
    { href: "/product", label: "Product" },
    { href: "/team", label: "Team" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
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
            <div className="border-t border-[#E5E5E3] pt-5 flex flex-col gap-5">
              <Link
                href="/login"
                className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Try Demo
              </Link>
              <Link
                href="/beta"
                className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Waitlist
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar Nav */}
        <nav className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-[220px] pt-[120px] pl-10 pr-6">
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
          <div className="border-t border-[#E5E5E3] mt-6 pt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
            >
              Try Demo
            </Link>
            <Link
              href="/beta"
              className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-[220px] px-5 sm:px-10 lg:px-10 xl:px-14 pt-20 lg:pt-[120px] w-full max-w-[860px]">
          {children}
        </main>
      </div>
    </div>
  );
}
