"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SynapseLogo } from "@/components/synapse-logo";
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
} from "lucide-react";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-gray-200/80 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-12 border-b border-gray-200/80">
        <SynapseLogo className="h-6 w-6" />
        <span className="text-[14px] font-semibold text-gray-900 tracking-tight">
          Synapse
        </span>
      </div>

      {/* Navigation */}
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

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-200/80">
        <button className="flex items-center gap-2.5 w-full px-3 py-[7px] rounded-lg text-[13px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <LogOut className="h-[15px] w-[15px]" />
          Log out
        </button>
      </div>
    </aside>
  );
}
