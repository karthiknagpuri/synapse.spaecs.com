"use client";

import type { ResearchProfileData, ResearchSource } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Briefcase,
  MapPin,
  Building,
  MessageSquare,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

interface ContactAISummaryProps {
  profileData: ResearchProfileData;
  sources: ResearchSource[];
}

export function ContactAISummary({ profileData, sources }: ContactAISummaryProps) {
  return (
    <div className="p-6 rounded-xl border border-gray-900/10 bg-white space-y-5">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-[#7C3AED]" />
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          AI Summary
        </h2>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 leading-relaxed">
        {profileData.summary}
      </p>

      {/* Key Facts */}
      <div className="grid grid-cols-2 gap-3">
        {profileData.current_role && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-900">
                {profileData.current_role.title}
              </p>
              <p className="text-xs text-gray-500">
                {profileData.current_role.company}
              </p>
            </div>
          </div>
        )}
        {profileData.industry && (
          <div className="flex items-start gap-2">
            <Building className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-900">Industry</p>
              <p className="text-xs text-gray-500">{profileData.industry}</p>
            </div>
          </div>
        )}
        {profileData.location && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-900">Location</p>
              <p className="text-xs text-gray-500">{profileData.location}</p>
            </div>
          </div>
        )}
        {profileData.education?.length > 0 && (
          <div className="flex items-start gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-900">Education</p>
              <p className="text-xs text-gray-500">
                {profileData.education[0].institution}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      {profileData.skills?.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1">
            {profileData.skills.slice(0, 8).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Talking Points */}
      {profileData.talking_points?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="h-3 w-3 text-gray-400" />
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Talking Points
            </p>
          </div>
          <ul className="space-y-1.5">
            {profileData.talking_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-300 mt-1 text-[8px]">●</span>
                <span className="text-xs text-gray-600">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {sources?.length > 0 && (
        <div className="border-t border-gray-900/5 pt-4">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
            Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactAISummaryPlaceholder({
  contactName,
  contactTitle,
  contactCompany,
  contactId,
}: {
  contactName: string;
  contactTitle?: string | null;
  contactCompany?: string | null;
  contactId: string;
}) {
  const researchUrl = `/dashboard/research?name=${encodeURIComponent(contactName)}&context=${encodeURIComponent([contactTitle, contactCompany].filter(Boolean).join(" at "))}&contact_id=${contactId}`;

  return (
    <div className="p-6 rounded-xl border border-dashed border-gray-900/10 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-gray-300" />
          <p className="text-sm text-gray-500">No AI summary available</p>
        </div>
        <a
          href={researchUrl}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
        >
          <Wand2 className="h-3 w-3" />
          Generate AI Summary
        </a>
      </div>
    </div>
  );
}
