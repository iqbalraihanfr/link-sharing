import { config, isTurnstileConfigured } from "@/lib/config";
import { AppError } from "@/lib/errors";

interface TurnstileResult {
  success: boolean;
}

export async function verifyTurnstileToken(
  token: string | undefined,
  ipAddress: string,
) {
  if (!isTurnstileConfigured()) return;

  if (!token) {
    throw new AppError("Verifikasi captcha dibutuhkan sebelum submit.", {
      status: 422,
      code: "CAPTCHA_REQUIRED",
    });
  }

  const body = new URLSearchParams({
    secret: config.turnstileSecretKey,
    response: token,
    remoteip: ipAddress,
  });

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as TurnstileResult;

  if (!payload.success) {
    throw new AppError("Captcha tidak lolos verifikasi. Muat ulang lalu coba lagi.", {
      status: 422,
      code: "CAPTCHA_FAILED",
    });
  }
}
