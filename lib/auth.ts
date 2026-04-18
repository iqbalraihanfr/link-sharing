import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  assertAdminPasswordConfigured,
  config,
  EDIT_SESSION_SECONDS,
} from "@/lib/config";
import { AppError } from "@/lib/errors";
import {
  compareSecret,
  compareSecretHash,
  createSignedSession,
  getSessionCookieName,
  verifySignedSession,
} from "@/lib/security";

function getCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.sessionCookieSecure,
    maxAge,
  };
}

export function issueEditSession(response: NextResponse, profileId: string) {
  response.cookies.set(
    getSessionCookieName("edit"),
    createSignedSession("edit", profileId),
    getCookieOptions(EDIT_SESSION_SECONDS),
  );
}

export function clearEditSession(response: NextResponse) {
  response.cookies.set(getSessionCookieName("edit"), "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
}

export function issueAdminSession(response: NextResponse) {
  response.cookies.set(
    getSessionCookieName("admin"),
    createSignedSession("admin", "admin"),
    getCookieOptions(60 * 60 * 8),
  );
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(getSessionCookieName("admin"), "", {
    ...getCookieOptions(0),
    maxAge: 0,
  });
}

export function getEditSessionProfileIdFromRequest(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName("edit"))?.value;
  const payload = verifySignedSession(token, "edit");
  return payload?.sub ?? null;
}

export async function getEditSessionProfileIdFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName("edit"))?.value;
  const payload = verifySignedSession(token, "edit");
  return payload?.sub ?? null;
}

export function assertEditSession(
  request: NextRequest,
  expectedProfileId: string,
): string {
  const subject = getEditSessionProfileIdFromRequest(request);

  if (!subject || subject !== expectedProfileId) {
    throw new AppError("Sesi edit tidak valid atau sudah kedaluwarsa.", {
      status: 401,
      code: "EDIT_SESSION_INVALID",
    });
  }

  return subject;
}

export function assertAdminPassword(password: string) {
  assertAdminPasswordConfigured();

  if (config.adminPasswordHash) {
    return compareSecretHash(password, config.adminPasswordHash);
  }

  return compareSecret(password, config.adminPassword);
}

export function assertAdminSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName("admin"))?.value;
  const payload = verifySignedSession(token, "admin");

  if (!payload) {
    throw new AppError("Sesi admin tidak valid atau sudah kedaluwarsa.", {
      status: 401,
      code: "ADMIN_SESSION_INVALID",
    });
  }

  return payload;
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName("admin"))?.value;
  return Boolean(verifySignedSession(token, "admin"));
}
