import { createClient } from "@/lib/supabase/server";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { TopbarBreadcrumb } from "@/components/topbar-breadcrumb";
import { Bell } from "lucide-react";

export async function Topbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = user?.user_metadata?.full_name || "";
  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

  return (
    <header className="flex items-center justify-between h-12 px-6 border-b border-gray-200/80 bg-white">
      <TopbarBreadcrumb />

      <div className="flex items-center gap-1">
        <button className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell className="h-[15px] w-[15px]" />
        </button>
        <ProfileDropdown
          name={name}
          email={email}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}
