import { NextResponse } from "next/server";

export class AppError extends Error {
  status: number;
  code: string;
  expose: boolean;

  constructor(
    message: string,
    options?: { status?: number; code?: string; expose?: boolean },
  ) {
    super(message);
    this.name = "AppError";
    this.status = options?.status ?? 400;
    this.code = options?.code ?? "APP_ERROR";
    this.expose = options?.expose ?? true;
  }
}

export class ConfigurationError extends AppError {
  constructor(message = "Server is not configured yet.") {
    super(message, {
      status: 503,
      code: "CONFIGURATION_ERROR",
    });
    this.name = "ConfigurationError";
  }
}

export function getErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "Unexpected server error.", code: "INTERNAL_SERVER_ERROR" },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
