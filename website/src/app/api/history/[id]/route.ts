import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await apiFetch(`/api/history/${id}`, { accessToken });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || "Failed to fetch generation";
    return NextResponse.json({ error: message }, { status });
  }
}
