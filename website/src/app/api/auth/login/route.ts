import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { setAuthCookies } from "@/lib/auth";
import { API_PATHS } from "@prism/shared";
import type { AuthResponse, LoginRequest } from "@prism/shared";

export async function POST(request: NextRequest) {
  const body: LoginRequest = await request.json();

  try {
    const data = await apiFetch<AuthResponse>(API_PATHS.AUTH_LOGIN, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = NextResponse.json({ user: data.user });
    setAuthCookies(response, data.tokens.accessToken, data.tokens.refreshToken);
    return response;
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || "Login failed";
    return NextResponse.json({ error: message }, { status });
  }
}
