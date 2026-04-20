import { NextRequest, NextResponse } from "next/server";

import {
  assertAdminPassword,
  clearAdminSession,
  issueAdminSession,
} from "@/lib/auth";
import { AppError, getErrorResponse } from "@/lib/errors";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIpAddress } from "@/lib/request";
import { parseRequestBody, adminSessionBodySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    const rateLimit = consumeRateLimit(`admin:session:${ipAddress}`, {
      windowMs: 60_000,
      maxAttempts: 5,
    });

    if (!rateLimit.allowed) {
      throw new AppError("Terlalu banyak percobaan login. Coba lagi sebentar.", {
        status: 429,
        code: "ADMIN_RATE_LIMITED",
      });
    }

    const body = await parseRequestBody(
      request,
      adminSessionBodySchema,
      "Password admin wajib diisi.",
    );
    const password = body.password.trim();

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
