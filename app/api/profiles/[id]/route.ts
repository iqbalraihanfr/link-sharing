import { NextRequest, NextResponse } from "next/server";

import { assertEditSession, clearEditSession } from "@/lib/auth";
import { getErrorResponse } from "@/lib/errors";
import { deleteProfile, updateProfile } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    assertEditSession(request, id);

    const body = (await request.json()) as {
      displayName?: string;
      instagramInput?: string;
      linkedinInput?: string;
    };

    const profile = await updateProfile(id, {
      displayName: body.displayName ?? "",
      instagramInput: body.instagramInput,
      linkedinInput: body.linkedinInput,
    });

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
    const { id } = await params;
    assertEditSession(request, id);

    await deleteProfile(id);

    const response = NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    clearEditSession(response);
    return response;
  } catch (error) {
    return getErrorResponse(error);
  }
}
