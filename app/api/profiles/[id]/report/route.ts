import { NextRequest, NextResponse } from "next/server";

import { getErrorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIpAddress } from "@/lib/request";
import { hashIpAddress } from "@/lib/security";
import { reportProfile } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ipAddress = getClientIpAddress(request);
    await enforceRateLimit("profile-report", ipAddress, 20, "1 h");

    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const profile = await reportProfile(id, hashIpAddress(ipAddress), body.reason);

    return NextResponse.json(
      { success: true, profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return getErrorResponse(error);
  }
}
