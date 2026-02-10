import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { setAuthCookies } from "@/lib/auth";
import { API_PATHS } from "@prism/shared";
import type { AuthResponse, RegisterRequest } from "@prism/shared";

export async function POST(request: NextRequest) {
  const body: RegisterRequest = await request.json();

  try {
    const data = await apiFetch<AuthResponse>(API_PATHS.AUTH_REGISTER, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = NextResponse.json({ user: data.user }, { status: 201 });
    setAuthCookies(response, data.tokens.accessToken, data.tokens.refreshToken);
    return response;
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message =
      (error as { message?: string }).message || "Registration failed";
    return NextResponse.json({ error: message }, { status });
  }
}
