import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import {
  ADMIN_SESSION_SECONDS,
  config,
  EDIT_SESSION_SECONDS,
} from "@/lib/config";

type SessionKind = "admin" | "edit";

interface SessionPayload {
  exp: number;
  kind: SessionKind;
  sub: string;
}

const SESSION_COOKIE_NAMES = {
  admin: "handshake_admin_session",
  edit: "handshake_edit_session",
} as const;

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function createEditToken() {
  const raw = randomBytes(24).toString("base64url");
  return {
    raw,
    hash: sha256(raw),
  };
}

function sign(value: string) {
  return createHmac("sha256", config.appSecret).update(value).digest("base64url");
}

export function hashIpAddress(ipAddress: string) {
  return sign(`ip:${ipAddress}`);
}

function toBase64UrlJson(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function createSignedSession(kind: SessionKind, subject: string) {
  const ttl = kind === "admin" ? ADMIN_SESSION_SECONDS : EDIT_SESSION_SECONDS;
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + ttl,
    kind,
    sub: subject,
  };
  const encodedPayload = toBase64UrlJson(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySignedSession(
  token: string | undefined,
  kind: SessionKind,
) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (payload.kind !== kind || payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function compareSecret(candidate: string, expectedSecret: string) {
  const left = Buffer.from(sha256(candidate));
  const right = Buffer.from(sha256(expectedSecret));

  return left.length === right.length && timingSafeEqual(left, right);
}

export function compareSecretHash(candidate: string, expectedHash: string) {
  const left = Buffer.from(sha256(candidate));
  const right = Buffer.from(expectedHash);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function getSessionCookieName(kind: SessionKind) {
  return SESSION_COOKIE_NAMES[kind];
}
