import { NextRequest, NextResponse } from "next/server";

import { issueEditSession } from "@/lib/auth";
import { getErrorResponse } from "@/lib/errors";
import { sha256 } from "@/lib/security";
import { findProfileByEditTokenHash } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const profile = await findProfileByEditTokenHash(sha256(token));

    if (!profile) {
      return NextResponse.redirect(new URL("/?edit=invalid", request.url));
    }

    const response = NextResponse.redirect(
      new URL(`/edit/manage/${profile.id}`, request.url),
      { status: 302 },
    );
    issueEditSession(response, profile.id);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return getErrorResponse(error);
  }
}
