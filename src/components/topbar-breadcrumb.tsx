"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Home",
  contacts: "Contacts",
  friends: "Friends",
  groups: "Groups",
  research: "Research",
  pipelines: "Pipelines",
  integrations: "Connectors",
  api: "API",
  settings: "Settings",
  search: "Search",
};

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items from path segments
  const crumbs: { label: string; href: string }[] = [];

  if (segments[0] === "dashboard") {
    crumbs.push({ label: "Synapse", href: "/dashboard" });

    if (segments.length > 1) {
      const section = segments[1];
      const label = LABELS[section] || section.charAt(0).toUpperCase() + section.slice(1);
      crumbs.push({ label, href: `/dashboard/${section}` });
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {crumbs.map((crumb, i) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
          {i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[13px] font-medium text-gray-700">
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
