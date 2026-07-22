import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { getAuthEnv } from "@/lib/env";

const SESSION_COOKIE_NAME = "watchdog_session";
const SESSION_DURATION = "7d";

type Session = {
  role: "admin";
};

function getSecret() {
  return new TextEncoder().encode(getAuthEnv().AUTH_SECRET);
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" } satisfies Session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    return payload.role === "admin" ? { role: "admin" } : null;
  } catch {
    return null;
  }
}
