import { NextRequest, NextResponse } from "next/server";

import { assertEditSession, clearEditSession } from "@/lib/auth";
import { getErrorResponse } from "@/lib/errors";
import { deleteProfile, updateProfile } from "@/lib/store";
import { parseRequestBody, updateProfileBodySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    assertEditSession(request, id);

    const body = await parseRequestBody(
      request,
      updateProfileBodySchema,
      "Input profil tidak valid.",
    );

    const profile = await updateProfile(id, {
      displayName: body.displayName ?? "",
      instagramInput: body.instagramInput,
      linkedinInput: body.linkedinInput,
      githubInput: body.githubInput,
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
