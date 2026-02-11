import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = await apiFetch<{
      productSlug: string;
      plan: string;
      status: string;
      usageLimit: number;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      paymentId: string;
    }>("/api/billing/verify", {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message =
      (error as { message?: string }).message || "Verification failed";
    return NextResponse.json({ error: message }, { status });
  }
}
