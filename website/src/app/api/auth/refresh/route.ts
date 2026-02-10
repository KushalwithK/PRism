import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/auth";
import { API_PATHS } from "@prism/shared";
import type { AuthResponse } from "@prism/shared";

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    const response = NextResponse.json({ error: "No refresh token" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    const data = await apiFetch<AuthResponse>(API_PATHS.AUTH_REFRESH, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    const response = NextResponse.json({ user: data.user });
    setAuthCookies(response, data.tokens.accessToken, data.tokens.refreshToken);
    return response;
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 401;
    const message = (error as { message?: string }).message || "Refresh failed";
    const response = NextResponse.json({ error: message }, { status });
    if (status === 401) {
      clearAuthCookies(response);
    }
    return response;
  }
}
