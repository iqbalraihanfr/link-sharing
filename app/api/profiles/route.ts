import { NextRequest, NextResponse } from "next/server";

import { getRequestOrigin, getClientIpAddress } from "@/lib/request";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createProfile } from "@/lib/store";
import { AppError, getErrorResponse } from "@/lib/errors";
import { createProfileBodySchema, parseRequestBody } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIpAddress(request);
    const body = await parseRequestBody(
      request,
      createProfileBodySchema,
      "Input profil tidak valid.",
    );

    if (body.website?.trim()) {
      throw new AppError("Form spam terdeteksi.", {
        status: 422,
        code: "HONEYPOT_TRIGGERED",
      });
    }

    await verifyTurnstileToken(body.turnstileToken, ipAddress);

    const result = await createProfile({
      displayName: body.displayName ?? "",
      instagramInput: body.instagramInput,
      linkedinInput: body.linkedinInput,
      githubInput: body.githubInput,
    });

    return NextResponse.json(
      {
        profileId: result.profileId,
        editUrl: `${getRequestOrigin(request)}/edit/${result.editToken}`,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return getErrorResponse(error);
  }
}
