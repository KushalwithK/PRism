import { NextRequest } from "next/server";

/**
 * Returns the public-facing origin (e.g. "https://lucentapps.in")
 * by reading reverse-proxy headers. Falls back to request.url
 * when running without a proxy (local dev).
 */
export function getPublicOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  if (host) {
    return `${proto}://${host}`;
  }

  return request.url;
}
