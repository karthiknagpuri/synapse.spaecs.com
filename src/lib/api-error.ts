import { NextResponse } from "next/server";

interface ProblemDetails {
  status: number;
  title: string;
  detail: string;
  instance?: string;
  type?: string;
}

/**
 * RFC 7807 Problem Details error response.
 */
export function apiError({
  status,
  title,
  detail,
  instance,
  type = "about:blank",
}: ProblemDetails): NextResponse {
  return NextResponse.json(
    { type, title, status, detail, instance },
    {
      status,
      headers: { "Content-Type": "application/problem+json" },
    }
  );
}
