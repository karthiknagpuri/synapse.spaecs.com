"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ResearchProfile } from "@/types";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Trophy,
  MessageCircle,
  Globe,
  ExternalLink,
  Clock,
  AlertCircle,
  Telescope,
  MapPin,
  Building,
  Tag,
  Brain,
} from "lucide-react";

export default function ResearchResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [research, setResearch] = useState<ResearchProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResearch = useCallback(async () => {
    try {
      const res = await fetch(`/api/research/${id}`);
      if (!res.ok) {
        setError("Research not found");
        return;
      }
      const data = await res.json();
      setResearch(data);
    } catch {
      setError("Failed to load research");
    }
  }, [id]);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  // Poll while pending or researching
  useEffect(() => {
    if (
      !research ||
      research.status === "completed" ||
      research.status === "failed"
    )
      return;

    const interval = setInterval(fetchResearch, 2000);
    return () => clearInterval(interval);
  }, [research, fetchResearch]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={() => router.push("/dashboard/research")}
          className="mt-4 text-sm text-purple-600 hover:underline"
        >
          Back to Research
        </button>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Loading state
  if (research.status === "pending" || research.status === "researching") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/research"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="p-8 rounded-xl border border-gray-200 bg-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4">
            <Telescope className="h-7 w-7 text-purple-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Researching {research.query_name}
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Searching the web, gathering public information, and building
            a comprehensive profile. This usually takes 15-30 seconds.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">
              {research.status === "pending"
                ? "Queuing research..."
                : "Analyzing data..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (research.status === "failed") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/research"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="p-8 rounded-xl border border-red-100 bg-white text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            Research Failed
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {research.error_message || "Something went wrong."}
          </p>
          <button
            onClick={() => router.push("/dashboard/research")}
            className="mt-4 text-sm text-purple-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Completed — show full profile
  const profile = research.profile_data;
  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/research"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        {research.processing_time_ms && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {(research.processing_time_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Header / Summary */}
      <div className="p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 text-purple-700 text-lg font-semibold shrink-0">
            {research.query_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">
              {research.query_name}
            </h1>
            {profile.current_role && (
              <p className="text-sm text-gray-500 mt-0.5">
                {profile.current_role.title} at{" "}
                {profile.current_role.company}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {profile.industry && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Building className="h-3 w-3" />
                  {profile.industry}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-4">
          {profile.summary}
        </p>

        {/* Social Links */}
        {profile.social_presence && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.social_presence.linkedin && (
              <SocialLink
                href={profile.social_presence.linkedin}
                label="LinkedIn"
              />
            )}
            {profile.social_presence.twitter && (
              <SocialLink
                href={
                  profile.social_presence.twitter.startsWith("http")
                    ? profile.social_presence.twitter
                    : `https://x.com/${profile.social_presence.twitter.replace("@", "")}`
                }
                label="X / Twitter"
              />
            )}
            {profile.social_presence.github && (
              <SocialLink
                href={profile.social_presence.github}
                label="GitHub"
              />
            )}
            {profile.social_presence.website && (
              <SocialLink
                href={profile.social_presence.website}
                label="Website"
              />
            )}
          </div>
        )}
      </div>

      {/* Current Role */}
      {profile.current_role && (
        <Section icon={Briefcase} title="Current Role">
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-900">
              {profile.current_role.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {profile.current_role.company}
            </p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {profile.current_role.description}
            </p>
          </div>
        </Section>
      )}

      {/* Career History */}
      {profile.career_history.length > 0 && (
        <Section icon={Briefcase} title="Career History">
          <div className="space-y-3">
            {profile.career_history.map((role, i) => (
              <div
                key={i}
                className="relative pl-6 pb-3 border-l border-gray-200 last:border-0 last:pb-0"
              >
                <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400" />
                <p className="text-sm font-medium text-gray-900">
                  {role.title}
                </p>
                <p className="text-xs text-gray-500">
                  {role.company} &middot; {role.period}
                </p>
                {role.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {role.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {profile.education.length > 0 && (
        <Section icon={GraduationCap} title="Education">
          <div className="space-y-3">
            {profile.education.map((edu, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-900">
                  {edu.institution}
                </p>
                <p className="text-xs text-gray-500">
                  {edu.degree}
                  {edu.field && ` in ${edu.field}`}
                  {edu.year && ` (${edu.year})`}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <Section icon={Tag} title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Notable Achievements */}
      {profile.notable_achievements.length > 0 && (
        <Section icon={Trophy} title="Notable Achievements">
          <ul className="space-y-2">
            {profile.notable_achievements.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="text-purple-500 mt-0.5 shrink-0">
                  &bull;
                </span>
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Interests */}
      {profile.interests.length > 0 && (
        <Section icon={Lightbulb} title="Interests">
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700"
              >
                {interest}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Talking Points */}
      {profile.talking_points.length > 0 && (
        <Section icon={MessageCircle} title="Talking Points">
          <ul className="space-y-2">
            {profile.talking_points.map((tp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="text-purple-500 mt-0.5 shrink-0">
                  &bull;
                </span>
                {tp}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Personality Insights */}
      {profile.personality_insights && (
        <Section icon={Brain} title="Personality Insights">
          <p className="text-sm text-gray-600 leading-relaxed">
            {profile.personality_insights}
          </p>
        </Section>
      )}

      {/* Sources */}
      {research.sources && research.sources.length > 0 && (
        <Section icon={Globe} title="Sources">
          <div className="space-y-2">
            {research.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0 group-hover:text-purple-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate group-hover:text-purple-700">
                    {source.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {source.snippet}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-medium text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
    >
      <Globe className="h-3 w-3" />
      {label}
    </a>
  );
}
