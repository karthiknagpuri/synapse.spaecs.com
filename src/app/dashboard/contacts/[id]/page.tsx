import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Telescope,
  ExternalLink,
  Plus,
  Calendar,
  Mail,
  MessageSquare,
} from "lucide-react";
import {
  GmailIcon,
  GoogleCalendarIcon,
  LinkedInIcon,
} from "@/components/platform-icons";
import { RelationshipScore } from "@/components/relationship-score";
import { ContactReminder } from "@/components/contact-reminder";
import { ContactEnrichButton } from "@/components/contact-enrich-button";
import ContactNotes from "@/components/contact-notes";
import { ContactProfileTabs } from "@/components/contact-profile-tabs";

export const dynamic = "force-dynamic";

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 60) return `${diffMins} min. ago`;
  if (diffHours < 24) return `${diffHours} hr. ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 5) return `${diffWeeks} wk. ago`;
  if (diffMonths < 12) return `${diffMonths} mo. ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default async function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!contact) notFound();

  const [
    { data: interactions },
    { data: researchProfiles },
    { data: pipelineCards },
  ] = await Promise.all([
    supabase
      .from("interactions")
      .select("*")
      .eq("contact_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("research_profiles")
      .select("*")
      .eq("contact_id", id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("pipeline_cards")
      .select("*, stage:pipeline_stages(id, name, pipeline:pipelines(id, name))")
      .eq("contact_id", id)
      .eq("user_id", user?.id),
  ]);

  const researchProfile = researchProfiles?.[0] || null;
  const profileData = researchProfile?.profile_data || null;

  // Deduplicate interactions
  const seen = new Set<string>();
  const dedupedInteractions = (interactions || []).filter((i) => {
    const key = `${i.type}-${i.platform}-${i.occurred_at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const initials = contact.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Extract pipeline names from cards
  const pipelineNames: string[] = [];
  (pipelineCards || []).forEach((card: Record<string, unknown>) => {
    const stage = card.stage as Record<string, unknown> | null;
    const pipeline = stage?.pipeline as Record<string, string> | null;
    if (pipeline?.name && !pipelineNames.includes(pipeline.name)) {
      pipelineNames.push(pipeline.name);
    }
  });

  // Build relationship summary text
  let relationshipSummary: string | null = null;
  if (profileData?.summary) {
    relationshipSummary = profileData.summary;
  } else if (contact.last_interaction_at) {
    const firstDate = new Date(contact.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const source = contact.source === "gmail" ? "email" : contact.source === "calendar" ? "calendar" : contact.source;
    const parts = [
      `You first connected with ${contact.full_name.split(" ")[0]} over ${source} on ${firstDate}.`,
    ];
    if (contact.title && contact.company) {
      parts.push(`${contact.full_name.split(" ")[0]} is ${contact.title} at ${contact.company}.`);
    }
    if (contact.interaction_count > 0) {
      parts.push(`You've had ${contact.interaction_count} interaction${contact.interaction_count !== 1 ? "s" : ""} so far.`);
    }
    relationshipSummary = parts.join(" ");
  }

  // Career history from research
  const careerHistory = profileData?.career_history || [];
  const education = profileData?.education || [];
  const interests = profileData?.interests || [];
  const highlights = profileData?.notable_achievements || [];

  const platformIcon = (platform: string) => {
    switch (platform) {
      case "gmail":
        return <GmailIcon className="h-4 w-4" />;
      case "calendar":
        return <GoogleCalendarIcon className="h-4 w-4" />;
      case "linkedin":
        return <LinkedInIcon className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const interactionLabel = (type: string, platform: string) => {
    if (platform === "calendar") return "met with";
    if (type === "email_sent") return "you emailed";
    if (type === "email_received") return `${contact.full_name.split(" ")[0].toLowerCase()} emailed you`;
    return type.replace("_", " ");
  };

  // Prepare data for client tabs component
  const tabData = {
    contact,
    relationshipSummary,
    pipelineNames,
    dedupedInteractions: dedupedInteractions.map((i) => ({
      id: i.id,
      platform: i.platform,
      type: i.type,
      subject: i.subject,
      snippet: i.snippet,
      occurred_at: i.occurred_at,
      label: interactionLabel(i.type, i.platform),
      relativeTime: formatRelativeTime(i.occurred_at),
      iconType: i.platform as "gmail" | "calendar" | "linkedin" | "other",
    })),
    interests,
    highlights,
    careerHistory,
    education,
    profileData,
    researchSources: researchProfile?.sources || [],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Profile Header */}
      <div className="pb-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            {contact.avatar_url ? (
              <img
                src={contact.avatar_url}
                alt={contact.full_name}
                referrerPolicy="no-referrer"
                className="aspect-square size-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gray-100 text-gray-500 text-xl font-medium">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                {contact.full_name}
              </h1>
              {contact.relationship_score != null && (
                <RelationshipScore score={contact.relationship_score} variant="compact" />
              )}
            </div>
            {(contact.title || contact.company) && (
              <p className="text-sm text-gray-500 mt-0.5">
                {[contact.title?.toLowerCase(), contact.company?.toLowerCase()]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LinkedInIcon className="h-4 w-4" />
                </a>
              )}
              {contact.twitter_handle && (
                <a
                  href={`https://x.com/${contact.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
                >
                  𝕏
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ContactReminder
              contactId={contact.id}
              currentFrequency={contact.reminder_frequency}
            />
            <ContactEnrichButton
              contactId={contact.id}
              contact={{
                full_name: contact.full_name,
                company: contact.company,
                title: contact.title,
                location: contact.location,
                bio: contact.bio,
                linkedin_url: contact.linkedin_url,
                twitter_handle: contact.twitter_handle,
              }}
            />
            <Link
              href={`/dashboard/research?name=${encodeURIComponent(contact.full_name)}&context=${encodeURIComponent([contact.title, contact.company].filter(Boolean).join(" at "))}&contact_id=${contact.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
            >
              <Telescope className="h-3 w-3" />
              Research
            </Link>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <ContactProfileTabs data={tabData} contactId={id} />
    </div>
  );
}
