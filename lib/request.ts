import type { NextRequest } from "next/server";

export function getClientIpAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "0.0.0.0";
  }

  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}

export function getRequestOrigin(request: NextRequest) {
  return new URL(request.url).origin;
}
