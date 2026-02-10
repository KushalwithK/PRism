import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = await apiFetch(`/api/templates/${id}`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || "Failed to update template";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await apiFetch(`/api/templates/${id}`, {
      method: "DELETE",
      accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const status = (error as { status?: number }).status || 500;
    const message = (error as { message?: string }).message || "Failed to delete template";
    return NextResponse.json({ error: message }, { status });
  }
}
