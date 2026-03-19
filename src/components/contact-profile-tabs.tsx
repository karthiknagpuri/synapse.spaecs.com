"use client";

import { useState } from "react";
import { Plus, Calendar, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  GmailIcon,
  GoogleCalendarIcon,
  LinkedInIcon,
} from "@/components/platform-icons";
import {
  ContactAISummary,
  ContactAISummaryPlaceholder,
} from "@/components/contact-ai-summary";
import ContactNotes from "@/components/contact-notes";
import type { ResearchProfileData, ResearchSource } from "@/types";

type Tab = "about" | "company" | "job-history" | "notes";

interface InteractionItem {
  id: string;
  platform: string;
  type: string;
  subject: string | null;
  snippet: string | null;
  occurred_at: string;
  label: string;
  relativeTime: string;
  iconType: "gmail" | "calendar" | "linkedin" | "other";
}

interface CareerItem {
  title: string;
  company: string;
  period: string;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface TabDataProps {
  contact: {
    id: string;
    full_name: string;
    title: string | null;
    company: string | null;
    location: string | null;
    bio: string | null;
    email: string | null;
    tags: string[];
    source: string;
    created_at: string;
    linkedin_url: string | null;
    twitter_handle: string | null;
  };
  relationshipSummary: string | null;
  pipelineNames: string[];
  dedupedInteractions: InteractionItem[];
  interests: string[];
  highlights: string[];
  careerHistory: CareerItem[];
  education: EducationItem[];
  profileData: ResearchProfileData | null;
  researchSources: ResearchSource[];
}

const TAG_COLORS: Record<string, string> = {
  investor: "bg-amber-50 text-amber-700 border-amber-200",
  founder: "bg-purple-50 text-purple-700 border-purple-200",
  engineer: "bg-blue-50 text-blue-700 border-blue-200",
  designer: "bg-pink-50 text-pink-700 border-pink-200",
  recruiter: "bg-green-50 text-green-700 border-green-200",
  advisor: "bg-orange-50 text-orange-700 border-orange-200",
};

function PlatformIcon({ type }: { type: string }) {
  switch (type) {
    case "gmail":
      return <GmailIcon className="h-4 w-4" />;
    case "calendar":
      return <GoogleCalendarIcon className="h-4 w-4" />;
    case "linkedin":
      return <LinkedInIcon className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4 text-gray-400" />;
  }
}

export function ContactProfileTabs({
  data,
  contactId,
}: {
  data: TabDataProps;
  contactId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [showAllInteractions, setShowAllInteractions] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "about" },
    { id: "company", label: "company" },
    { id: "job-history", label: "job history" },
    { id: "notes", label: "notes" },
  ];

  const visibleInteractions = showAllInteractions
    ? data.dedupedInteractions
    : data.dedupedInteractions.slice(0, 4);
  const hiddenCount = data.dedupedInteractions.length - 4;

  return (
    <div className="space-y-0">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-6 space-y-6">
        {activeTab === "about" && (
          <>
            {/* Relationship Summary */}
            {data.relationshipSummary && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  relationship summary
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {data.relationshipSummary}
                </p>
              </div>
            )}

            {/* Pipeline + Lists side by side */}
            <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden">
              {/* Pipeline */}
              <div className="p-4 border-r border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">pipeline</h3>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {data.pipelineNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.pipelineNames.map((name) => (
                      <span
                        key={name}
                        className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">not assigned to any pipelines</p>
                )}
              </div>

              {/* Circles / Tags */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">circles</h3>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {data.contact.tags?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.contact.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-1 rounded-md border text-xs capitalize ${
                          TAG_COLORS[tag.toLowerCase()] || "border-gray-200 text-gray-600 bg-gray-50"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">no circles</p>
                )}
              </div>
            </div>

            {/* Interactions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">interactions</h3>
              {data.dedupedInteractions.length > 0 ? (
                <div className="space-y-0 border-l-2 border-gray-100 ml-2">
                  {visibleInteractions.map((interaction, idx) => (
                    <div
                      key={interaction.id}
                      className="flex items-start gap-3 pl-4 py-2 relative"
                    >
                      <div className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-gray-200 border-2 border-white" />
                      <PlatformIcon type={interaction.iconType} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-500">{interaction.label}</span>
                          {interaction.subject && (
                            <>
                              {" "}
                              <span className="font-medium text-gray-900">
                                {interaction.subject.length > 50
                                  ? interaction.subject.slice(0, 50) + "..."
                                  : interaction.subject}
                              </span>
                            </>
                          )}
                          {" "}
                          <ExternalLink className="inline h-3 w-3 text-gray-300" />
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                        {interaction.relativeTime}
                      </span>
                    </div>
                  ))}

                  {!showAllInteractions && hiddenCount > 0 && (
                    <div className="pl-4 py-2 relative">
                      <div className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-gray-100 border-2 border-white" />
                      <button
                        onClick={() => setShowAllInteractions(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                      >
                        <span className="text-gray-300">◇</span>
                        {hiddenCount} more interaction{hiddenCount !== 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 pl-6">no interactions recorded</p>
              )}
            </div>

            {/* Interests */}
            {data.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-600 bg-white"
                    >
                      {interest.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {data.highlights.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">highlights</h3>
                <div className="space-y-0 border-l-2 border-gray-100 ml-2">
                  {data.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 pl-4 py-2.5 relative"
                    >
                      <div className="absolute -left-[4px] top-4 w-[6px] h-[6px] rounded-full bg-gray-300" />
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {highlight.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "company" && (
          <div className="space-y-4">
            {data.contact.company ? (
              <div className="p-5 rounded-lg border border-gray-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {data.contact.company}
                </h3>
                {data.profileData?.industry && (
                  <p className="text-sm text-gray-500">
                    Industry: {data.profileData.industry}
                  </p>
                )}
                {data.contact.location && (
                  <p className="text-sm text-gray-500">
                    Location: {data.contact.location}
                  </p>
                )}
                {data.profileData?.current_role?.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {data.profileData.current_role.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No company information available.</p>
                <p className="text-xs text-gray-300 mt-1">
                  Run Research to populate company details.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "job-history" && (
          <div className="space-y-4">
            {data.careerHistory.length > 0 ? (
              <div className="space-y-0 border-l-2 border-gray-100 ml-2">
                {data.careerHistory.map((job, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 pl-4 py-3 relative"
                  >
                    <div className="absolute -left-[4px] top-5 w-[6px] h-[6px] rounded-full bg-gray-300" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {job.title}
                        </p>
                        {job.period && (
                          <span className="text-xs text-gray-400">{job.period}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{job.company}</p>
                      {job.description && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No job history available.</p>
                <p className="text-xs text-gray-300 mt-1">
                  Run Research to populate career history.
                </p>
              </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">education</h3>
                <div className="space-y-2">
                  {data.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {edu.institution}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                        {edu.year && ` · ${edu.year}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <ContactNotes contactId={contactId} />
        )}
      </div>
    </div>
  );
}
