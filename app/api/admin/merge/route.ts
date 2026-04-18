import { NextRequest, NextResponse } from "next/server";

import { assertAdminSession } from "@/lib/auth";
import { getErrorResponse } from "@/lib/errors";
import { adminMergeProfiles } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertAdminSession(request);
    const body = (await request.json()) as {
      sourceProfileId?: string;
      targetProfileId?: string;
    };

    const profile = await adminMergeProfiles(
      body.sourceProfileId ?? "",
      body.targetProfileId ?? "",
    );

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return getErrorResponse(error);
  }
}
