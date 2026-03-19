"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  Plug,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface ProfileDropdownProps {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function ProfileDropdown({ name, email, avatarUrl }: ProfileDropdownProps) {
  const router = useRouter();
  const supabase = createClient();

  const initials = name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors focus:outline-none">
          <Avatar className="h-7 w-7">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="aspect-square size-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gray-100 text-gray-500 text-[10px] font-medium">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-gray-600 max-w-[120px] truncate hidden sm:block">
            {name || email}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-gray-900/10 p-1.5">
        <div className="px-3 py-2.5 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>

        <DropdownMenuSeparator className="bg-gray-900/5" />

        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[13px] text-gray-700 cursor-pointer focus:bg-gray-50 focus:text-gray-900">
          <Link href="/dashboard/profile">
            <User className="h-4 w-4 mr-2.5 text-gray-400" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[13px] text-gray-700 cursor-pointer focus:bg-gray-50 focus:text-gray-900">
          <Link href="/dashboard/integrations">
            <Plug className="h-4 w-4 mr-2.5 text-gray-400" />
            Connectors
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[13px] text-gray-700 cursor-pointer focus:bg-gray-50 focus:text-gray-900">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4 mr-2.5 text-gray-400" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-900/5" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="rounded-lg px-3 py-2 text-[13px] text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
