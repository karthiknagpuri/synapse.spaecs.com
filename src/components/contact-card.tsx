import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { SearchResult } from "@/types";

export function ContactCard({
  result,
  whyMatched,
}: {
  result: SearchResult;
  whyMatched?: string;
}) {
  const initials = result.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const confidencePct = Math.round(result.similarity * 100);

  return (
    <Link href={`/dashboard/contacts/${result.contact_id}`}>
      <div className="rounded-xl border border-gray-900/10 bg-white hover:border-gray-900/20 transition-colors overflow-hidden">
        {/* Confidence Bar */}
        <div className="relative h-1 bg-gray-100">
          <div
            className="absolute inset-y-0 left-0 bg-[#7C3AED] rounded-r-full"
            style={{ width: `${confidencePct}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-11 w-11">
              {result.avatar_url ? (
                <img
                  src={result.avatar_url}
                  alt={result.full_name}
                  referrerPolicy="no-referrer"
                  className="aspect-square size-full rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gray-100 text-gray-500 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {result.full_name}
                </h3>
                {result.similarity > 0.8 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-900">
                    Strong match
                  </Badge>
                )}
              </div>
              {(result.title || result.company) && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {[result.title, result.company].filter(Boolean).join(" at ")}
                </p>
              )}
              {result.location && (
                <p className="text-xs text-gray-400 mt-0.5">{result.location}</p>
              )}
              {whyMatched && (
                <p className="text-sm italic text-gray-600 mt-2 leading-relaxed">
                  {whyMatched}
                </p>
              )}
              {result.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.slice(0, 4).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-medium text-[#7C3AED] tabular-nums">
                {confidencePct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
