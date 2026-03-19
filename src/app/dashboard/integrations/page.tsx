"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IntegrationCard } from "@/components/integration-card";
import {
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  GmailIcon,
  GoogleCalendarIcon,
  GoogleContactsIcon,
  LinkedInIcon,
  InstagramIcon,
  WhatsAppIcon,
  FacebookIcon,
  TelegramIcon,
  GitHubIcon,
  AppleIcon,
  SalesforceIcon,
  HubSpotIcon,
  CSVIcon,
  BusinessCardIcon,
} from "@/components/platform-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Integration } from "@/types";

const UPCOMING_CONNECTORS = [
  {
    name: "Instagram",
    icon: <InstagramIcon className="h-5 w-5" />,
    description: "Import followers and connections",
  },
  {
    name: "WhatsApp",
    icon: <WhatsAppIcon className="h-5 w-5" />,
    description: "Import contacts and chat history",
  },
  {
    name: "Facebook",
    icon: <FacebookIcon className="h-5 w-5" />,
    description: "Import friends and connections",
  },
  {
    name: "Telegram",
    icon: <TelegramIcon className="h-5 w-5" />,
    description: "Import contacts and group members",
  },
  {
    name: "GitHub",
    icon: <GitHubIcon className="h-5 w-5" />,
    description: "Import collaborators and network",
  },
  {
    name: "iOS Contacts",
    icon: <AppleIcon className="h-5 w-5" />,
    description: "Sync your phone contacts",
  },
];

const CUSTOM_DATA_SOURCES = [
  {
    name: "CSV File",
    icon: <CSVIcon className="h-5 w-5" />,
    description: "Import contacts from any spreadsheet",
  },
  {
    name: "Salesforce",
    icon: <SalesforceIcon className="h-5 w-5" />,
    description: "Import leads and contacts",
  },
  {
    name: "HubSpot",
    icon: <HubSpotIcon className="h-5 w-5" />,
    description: "Import contacts and deals",
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "error" | "warning"
  >("success");
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [reauthMessage, setReauthMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id);

      setIntegrations((data as Integration[]) || []);
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const googleIntegration = integrations.find((i) => i.platform === "google");
  const isGoogleConnected = googleIntegration?.status === "active";
  const needsReauth = googleIntegration?.status === "needs_reauth";

  const handleReauth = async () => {
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes:
          "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/contacts.other.readonly https://www.googleapis.com/auth/contacts.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      showMessage(`Re-auth failed: ${error.message}`, "error");
    }
  };

  const showMessage = (
    msg: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setMessage(msg);
    setMessageType(type);
  };

  const syncGmail = async () => {
    setMessage(null);
    const res = await fetch("/api/ingest/gmail", { method: "POST" });
    const data = await res.json();

    if (data.error === "reauth_required") {
      setReauthMessage(
        data.message || "Gmail permission missing. Please re-authenticate to grant access."
      );
      setShowReauthDialog(true);
      await loadIntegrations();
      return;
    }

    if (data.success) {
      const photoMsg =
        data.photos_updated > 0
          ? ` ${data.photos_updated} photos fetched.`
          : "";
      showMessage(
        `Gmail: ${data.contacts_created} contacts imported from ${data.threads_processed} threads.${photoMsg}`,
        "success"
      );
      await fetch("/api/embeddings", { method: "POST" });
      showMessage(
        `Gmail: ${data.contacts_created} contacts imported from ${data.threads_processed} threads.${photoMsg} Embeddings generated.`,
        "success"
      );
    } else {
      showMessage(`Gmail error: ${data.error}`, "error");
    }
  };

  const syncCalendar = async () => {
    setMessage(null);
    const res = await fetch("/api/ingest/calendar", { method: "POST" });
    const data = await res.json();

    if (data.error === "reauth_required") {
      setReauthMessage(
        data.message || "Calendar permission missing. Please re-authenticate to grant access."
      );
      setShowReauthDialog(true);
      await loadIntegrations();
      return;
    }

    if (data.success) {
      showMessage(
        `Calendar: ${data.contacts_created} contacts from ${data.events_processed} events.`,
        "success"
      );
      await fetch("/api/embeddings", { method: "POST" });
      showMessage(
        `Calendar: ${data.contacts_created} contacts from ${data.events_processed} events. Embeddings generated.`,
        "success"
      );
    } else {
      showMessage(`Calendar error: ${data.error}`, "error");
    }
  };


  const syncGoogleContacts = async () => {
    setMessage(null);
    const res = await fetch("/api/ingest/google-contacts", { method: "POST" });
    const data = await res.json();

    if (data.error === "reauth_required") {
      setReauthMessage(
        data.message || "Google Contacts permission missing. Please re-authenticate to grant access."
      );
      setShowReauthDialog(true);
      await loadIntegrations();
      return;
    }

    if (data.success) {
      const photoMsg =
        data.photos_updated > 0
          ? ` ${data.photos_updated} photos synced.`
          : "";
      showMessage(
        `Google Contacts: ${data.contacts_imported} contacts imported from ${data.contacts_fetched} found.${photoMsg}`,
        "success"
      );
      await fetch("/api/embeddings", { method: "POST" });
      showMessage(
        `Google Contacts: ${data.contacts_imported} contacts imported from ${data.contacts_fetched} found.${photoMsg} Embeddings generated.`,
        "success"
      );
    } else {
      showMessage(`Google Contacts error: ${data.error}`, "error");
    }
  };

  const handleRequest = (name: string) => {
    setRequested((prev) => new Set(prev).add(name));
    showMessage(
      `Thanks! We'll notify you when ${name} is available.`,
      "success"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const messageBg = {
    success: "bg-green-50 border-green-100 text-green-700",
    error: "bg-red-50 border-red-100 text-red-700",
    warning: "bg-amber-50 border-amber-100 text-amber-700",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">Connectors</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your accounts to build your network graph.
        </p>
      </div>

      {needsReauth && (
        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              Google permissions need updating. Re-authenticate to grant access.
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleReauth}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Re-authenticate
          </Button>
        </div>
      )}

      {message && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm ${messageBg[messageType]}`}
        >
          {message}
        </div>
      )}

      {/* Connected */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Connected
        </h2>
        <div className="space-y-3">
          <IntegrationCard
            platform="gmail"
            title="Gmail"
            description="Import contacts from your email conversations. Read-only access."
            icon={<GmailIcon className="h-5 w-5" />}
            isConnected={isGoogleConnected}
            lastSynced={googleIntegration?.last_synced_at}
            onSync={isGoogleConnected ? syncGmail : undefined}
          />
          <IntegrationCard
            platform="calendar"
            title="Google Calendar"
            description="Extract contacts from meeting attendees and events."
            icon={<GoogleCalendarIcon className="h-5 w-5" />}
            isConnected={isGoogleConnected}
            lastSynced={googleIntegration?.last_synced_at}
            onSync={isGoogleConnected ? syncCalendar : undefined}
          />
          <IntegrationCard
            platform="google-contacts"
            title="Google Contacts"
            description="Import your saved Google Contacts with names, phones, companies, and photos."
            icon={<GoogleContactsIcon className="h-5 w-5" />}
            isConnected={isGoogleConnected}
            lastSynced={googleIntegration?.last_synced_at}
            onSync={isGoogleConnected ? syncGoogleContacts : undefined}
          />
          <IntegrationCard
            platform="linkedin"
            title="LinkedIn"
            description="Import connections, messages, and more from your LinkedIn data export."
            icon={<LinkedInIcon className="h-5 w-5" />}
            isConnected={true}
            onNavigate={() => router.push("/dashboard/import/linkedin")}
          />
        </div>
      </section>

      {/* Coming Soon */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_CONNECTORS.map((connector) => (
            <div
              key={connector.name}
              className="p-4 rounded-xl border border-gray-900/10 bg-white flex items-start gap-3"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 shrink-0">
                {connector.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">
                  {connector.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {connector.description}
                </p>
                <button
                  onClick={() => handleRequest(connector.name)}
                  disabled={requested.has(connector.name)}
                  className="mt-2.5 text-xs font-medium text-gray-900 px-3 py-1.5 rounded-lg border border-gray-900/15 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {requested.has(connector.name) ? "Requested" : "Request"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Data */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Import Data
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Business Card — active, links to scanner */}
          <button
            onClick={() => router.push("/dashboard/import/business-card")}
            className="p-4 rounded-xl border border-gray-900/10 bg-white flex items-start gap-3 text-left hover:border-gray-900/20 transition-colors group"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 shrink-0">
              <BusinessCardIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900">Business Card</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Scan cards with AI-powered OCR
              </p>
              <span className="inline-flex items-center gap-1 mt-2.5 text-xs font-medium text-[#0A0A0A]">
                Scan
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>

          {/* CSV File — active, links to import wizard */}
          <button
            onClick={() => router.push("/dashboard/import")}
            className="p-4 rounded-xl border border-gray-900/10 bg-white flex items-start gap-3 text-left hover:border-gray-900/20 transition-colors group"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 shrink-0">
              <CSVIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900">CSV File</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Import contacts from any spreadsheet
              </p>
              <span className="inline-flex items-center gap-1 mt-2.5 text-xs font-medium text-[#0A0A0A]">
                Import
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>

          {/* Salesforce & HubSpot — coming soon */}
          {CUSTOM_DATA_SOURCES.filter((s) => s.name !== "CSV File").map(
            (source) => (
              <div
                key={source.name}
                className="p-4 rounded-xl border border-gray-900/10 bg-white flex items-start gap-3"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 shrink-0">
                  {source.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">
                    {source.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {source.description}
                  </p>
                  <button
                    onClick={() => handleRequest(source.name)}
                    disabled={requested.has(source.name)}
                    className="mt-2.5 text-xs font-medium text-gray-900 px-3 py-1.5 rounded-lg border border-gray-900/15 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {requested.has(source.name) ? "Requested" : "Request"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Reauth Dialog */}
      <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 mx-auto sm:mx-0 mb-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Permission Required
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {reauthMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowReauthDialog(false)}
              className="rounded-lg border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowReauthDialog(false);
                handleReauth();
              }}
              className="rounded-lg bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"
            >
              Re-authenticate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
