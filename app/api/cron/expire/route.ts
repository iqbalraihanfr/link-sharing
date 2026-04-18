import { NextRequest, NextResponse } from "next/server";

import { config } from "@/lib/config";
import { AppError, getErrorResponse } from "@/lib/errors";
import { expireProfiles } from "@/lib/store";

export const runtime = "nodejs";

function authorizeCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!config.cronSecret || authHeader !== `Bearer ${config.cronSecret}`) {
    throw new AppError("Unauthorized cron request.", {
      status: 401,
      code: "CRON_UNAUTHORIZED",
    });
  }
}

async function run(request: NextRequest) {
  authorizeCron(request);
  const result = await expireProfiles();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  try {
    return await run(request);
  } catch (error) {
    return getErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await run(request);
  } catch (error) {
    return getErrorResponse(error);
  }
}
