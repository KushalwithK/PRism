import { NextRequest, NextResponse } from "next/server";
import { getPublicOrigin } from "@/lib/url";

const PROTECTED_PATHS = ["/dashboard"];
const AUTH_PATHS = ["/login", "/register"];
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // 10-second buffer so we refresh slightly before real expiry
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  const origin = getPublicOrigin(request);

  // Redirect logged-in users away from auth pages
  if (isAuthPage && accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  // --- Protected route logic ---

  // If access token exists and is still valid, proceed
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // Access token missing or expired — try refreshing if we have a refresh token
  if (refreshToken) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.next();
        response.cookies.set("access_token", data.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        });
        response.cookies.set("refresh_token", data.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });
        return response;
      }
    } catch {
      // Refresh failed — fall through to redirect
    }
  }

  // No valid tokens — redirect to login
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
