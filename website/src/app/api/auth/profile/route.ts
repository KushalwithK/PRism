import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { API_PATHS } from "@prism/shared";
import type { UserProfile } from "@prism/shared";

export async function GET() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    const user = await apiFetch<UserProfile>(API_PATHS.AUTH_PROFILE, {
      accessToken,
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 401;
    const message = (error as { message?: string }).message || "Profile fetch failed";
    return NextResponse.json({ error: message }, { status });
  }
}
