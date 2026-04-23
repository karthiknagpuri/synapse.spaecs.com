"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SynapseLogo } from "@/components/synapse-logo";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  UserPlus,
  UsersRound,
  Plug,
  Settings,
  LayoutDashboard,
  Telescope,
  Code,
  Columns3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navGroups = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/dashboard/contacts", label: "Contacts", icon: Users },
      { href: "/dashboard/friends", label: "Friends", icon: UserPlus },
      { href: "/dashboard/groups", label: "Circles", icon: UsersRound },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/research", label: "Research", icon: Telescope },
      { href: "/dashboard/pipelines", label: "Pipelines", icon: Columns3 },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/integrations", label: "Connectors", icon: Plug },
      { href: "/dashboard/api", label: "API", icon: Code },
    ],
  },
  {
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                  >
                    <item.icon className="h-[15px] w-[15px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-200/80">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[13px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Log out
        </button>
      </div>
    </>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-5 h-12 border-b border-gray-200/80">
              <div className="flex items-center gap-2.5">
                <SynapseLogo className="h-6 w-6" />
                <span className="text-[14px] font-semibold text-gray-900 tracking-tight">
                  Synapse
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                <X className="h-[16px] w-[16px]" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-gray-200/80 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-12 border-b border-gray-200/80">
        <SynapseLogo className="h-6 w-6" />
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight">
          Synapse
        </span>
      </div>

      <SidebarContent />
    </aside>
  );
}
