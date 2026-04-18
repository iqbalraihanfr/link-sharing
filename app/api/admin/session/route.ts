import { NextRequest, NextResponse } from "next/server";

import {
  assertAdminPassword,
  clearAdminSession,
  issueAdminSession,
} from "@/lib/auth";
import { AppError, getErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIpAddress } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    await enforceRateLimit("admin-login", ipAddress, 12, "1 h");

    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";

    if (!password || !assertAdminPassword(password)) {
      throw new AppError("Password admin tidak valid.", {
        status: 401,
        code: "ADMIN_PASSWORD_INVALID",
      });
    }

    const response = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    issueAdminSession(response);
    return response;
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearAdminSession(response);
  return response;
}
