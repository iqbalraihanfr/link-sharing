import { NextRequest, NextResponse } from "next/server";

import { assertAdminSession } from "@/lib/auth";
import { getErrorResponse, AppError } from "@/lib/errors";
import { adminDeleteProfile, adminUpdateProfileStatus } from "@/lib/store";
import type { ProfileStatus } from "@/lib/types";

export const runtime = "nodejs";

function assertStatus(value: string): ProfileStatus {
  if (value === "active" || value === "flagged" || value === "hidden" || value === "expired") {
    return value;
  }

  throw new AppError("Status moderation tidak valid.", {
    status: 422,
    code: "INVALID_STATUS",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdminSession(request);
    const { id } = await params;
    const body = (await request.json()) as { status?: string };
    const profile = await adminUpdateProfileStatus(id, assertStatus(body.status ?? ""));

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertAdminSession(request);
    const { id } = await params;
    await adminDeleteProfile(id);

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return getErrorResponse(error);
  }
}
