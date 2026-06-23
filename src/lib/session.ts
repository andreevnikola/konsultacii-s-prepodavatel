import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionPayload {
  teacherId: string;
  exp: number;
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is not set");
  return s;
}

function hmac(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function buildToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${hmac(data)}`;
}

function parseToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const data = token.slice(0, dot);
  const sigBuf = Buffer.from(token.slice(dot + 1), "base64url");
  const expectedBuf = Buffer.from(hmac(data), "base64url");

  if (sigBuf.length !== expectedBuf.length) return null;
  try {
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

/** Read session from an incoming NextRequest — sync, for route handlers. */
export function getSession(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseToken(token);
}

/** Read session from the Next.js cookie store — async, for Server Components. */
export async function getSessionFromStore(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseToken(token);
}

/** Set the session cookie. Only valid in Route Handlers or Server Actions. */
export async function setSessionCookie(teacherId: string): Promise<void> {
  const cookieStore = await cookies();
  const payload: SessionPayload = { teacherId, exp: Date.now() + MAX_AGE * 1000 };
  cookieStore.set(COOKIE_NAME, buildToken(payload), {
    httpOnly: true,
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

/** Clear the session cookie. Only valid in Route Handlers or Server Actions. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}
