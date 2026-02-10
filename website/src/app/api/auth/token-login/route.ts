import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { setAuthCookies } from "@/lib/auth";
import { API_PATHS } from "@prism/shared";
import type { AuthResponse } from "@prism/shared";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirect =
    request.nextUrl.searchParams.get("redirect") || "/products/prism/pricing";

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const data = await apiFetch<AuthResponse>(API_PATHS.AUTH_REFRESH, {
      method: "POST",
      body: JSON.stringify({ refreshToken: token }),
    });

    const response = NextResponse.redirect(new URL(redirect, request.url));
    setAuthCookies(response, data.tokens.accessToken, data.tokens.refreshToken);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
