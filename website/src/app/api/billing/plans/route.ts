import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import type { ProductPlanInfo } from "@prism/shared";

export async function GET(request: NextRequest) {
  const productSlug = request.nextUrl.searchParams.get("productSlug");

  if (!productSlug) {
    return NextResponse.json(
      { error: "productSlug is required" },
      { status: 400 }
    );
  }

  try {
    const data = await apiFetch<ProductPlanInfo[]>(
      `/api/billing/plans?productSlug=${encodeURIComponent(productSlug)}`
    );
    return NextResponse.json(data);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message =
      (error as { message?: string }).message || "Failed to fetch plans";
    return NextResponse.json({ error: message }, { status });
  }
}
