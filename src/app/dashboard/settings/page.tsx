"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import TagManager from "@/components/tag-manager";

export default function SettingsPage() {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAllData = async () => {
    if (
      !confirm(
        "This will permanently delete ALL your contacts, interactions, and embeddings. This cannot be undone. Continue?"
      )
    )
      return;

    setDeleting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("contact_embeddings").delete().eq("user_id", user.id);
      await supabase.from("interactions").delete().eq("user_id", user.id);
      await supabase.from("contacts").delete().eq("user_id", user.id);
      await supabase.from("integrations").delete().eq("user_id", user.id);
      await supabase.from("ingestion_jobs").delete().eq("user_id", user.id);
    }

    setDeleting(false);
    alert("All data deleted.");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and data privacy.
        </p>
      </div>

      {/* Account */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Account</h2>
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tags & Auto-Tagging */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Tags & Auto-Tagging</h2>
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
          <h3 className="text-sm font-medium text-gray-900">Tag Definitions</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Define tags with criteria. Enable auto-assign to let AI classify your contacts automatically.
          </p>
          <TagManager />
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Data Management</h2>
        <div className="p-5 rounded-xl border border-red-200/60 bg-white">
          <h3 className="text-sm font-medium text-gray-900">Delete All Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Permanently remove all contacts, interactions, embeddings, and
            integration data. This cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteAllData}
            disabled={deleting}
            className="mt-4 gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete All My Data
          </Button>
        </div>
      </div>

      <Separator />

      {/* Privacy */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Privacy</h2>
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Email body never stored</p>
              <p className="text-xs text-gray-500">
                Only subject lines and 200-character snippets are saved.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Data never shared</p>
              <p className="text-xs text-gray-500">
                Your network data is private to your account. Never used to train AI models.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
            <div>
              <p className="text-sm text-gray-900">Read-only access</p>
              <p className="text-xs text-gray-500">
                Gmail and Calendar access is read-only. Synapse never sends emails or creates events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
