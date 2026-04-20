import { NextRequest, NextResponse } from "next/server";

import { assertAdminSession } from "@/lib/auth";
import { getErrorResponse } from "@/lib/errors";
import { adminMergeProfiles } from "@/lib/store";
import { adminMergeBodySchema, parseRequestBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertAdminSession(request);
    const body = await parseRequestBody(
      request,
      adminMergeBodySchema,
      "Payload merge profil tidak valid.",
    );

    const profile = await adminMergeProfiles(body.sourceProfileId, body.targetProfileId);

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return getErrorResponse(error);
  }
}
