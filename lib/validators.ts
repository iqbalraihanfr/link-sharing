import { z } from "zod";
import type { NextRequest } from "next/server";

import { AppError } from "@/lib/errors";

async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Payload JSON tidak valid.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }
}

function throwValidationError(message: string) {
  throw new AppError(message, {
    status: 422,
    code: "INVALID_INPUT",
  });
}

export async function parseRequestBody<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema,
  message = "Input tidak valid.",
): Promise<z.infer<TSchema>> {
  const body = await parseJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throwValidationError(message);
  }

  return parsed.data as z.infer<TSchema>;
}

export const createProfileBodySchema = z
  .object({
    displayName: z.string().optional(),
    instagramInput: z.string().optional(),
    linkedinInput: z.string().optional(),
    website: z.string().optional(),
    turnstileToken: z.string().optional(),
  })
  .strict();

export const updateProfileBodySchema = z
  .object({
    displayName: z.string().optional(),
    instagramInput: z.string().optional(),
    linkedinInput: z.string().optional(),
  })
  .strict();

export const adminSessionBodySchema = z
  .object({
    password: z.string().min(1).max(256),
  })
  .strict();

export const adminMergeBodySchema = z
  .object({
    sourceProfileId: z.string().uuid(),
    targetProfileId: z.string().uuid(),
  })
  .strict();

export const adminStatusBodySchema = z
  .object({
    status: z.enum(["active", "flagged", "hidden", "expired"]),
  })
  .strict();
