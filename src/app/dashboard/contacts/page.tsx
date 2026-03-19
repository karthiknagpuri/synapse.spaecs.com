import { createClient } from "@/lib/supabase/server";
import { ConnectionsDashboard } from "@/components/connections-dashboard";
import Link from "next/link";
import { Users } from "lucide-react";
import type { Contact } from "@/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [emailsResult, integrationsResult] = await Promise.all([
    supabase
      .from("interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id),
    supabase
      .from("integrations")
      .select("platform, status")
      .eq("user_id", user?.id)
      .eq("status", "active"),
  ]);

  // Fetch all contacts in batches of 1000 (Supabase default row limit)
  const PAGE_SIZE = 1000;
  let contacts: Contact[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user?.id)
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      contacts = contacts.concat(data);
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  const emailCount = emailsResult.count || 0;
  const accountCount = integrationsResult.data?.length || 0;

  if (contacts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-24">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No contacts yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Connect Gmail, Calendar, or upload your LinkedIn contacts to build
            your network.
          </p>
          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            Connect Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Connections</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {contacts.length} people in your network
        </p>
      </div>

      <ConnectionsDashboard
        contacts={contacts}
        stats={{
          connections: contacts.length,
          accounts: accountCount,
          emails: emailCount,
        }}
      />
    </div>
  );
}
