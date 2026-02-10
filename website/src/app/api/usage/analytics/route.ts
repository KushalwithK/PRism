import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const product = searchParams.get("product") || "prism";
  const days = searchParams.get("days") || "30";

  try {
    const data = await apiFetch(`/api/usage/analytics?product=${product}&days=${days}`, {
      accessToken,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status });
  }
}
