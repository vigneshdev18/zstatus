import { SignJWT, jwtVerify } from "jose";
import { User } from "@/lib/db/users";
import { NextRequest } from "next/server";
import { isProduction, TOKEN_KEY } from "../constants/app.constants";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

// Convert expiry string to seconds
function getExpiryInSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60;
    case "h":
      return value * 60 * 60;
    case "m":
      return value * 60;
    case "s":
      return value;
    default:
      return 7 * 24 * 60 * 60;
  }
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + getExpiryInSeconds(JWT_EXPIRES_IN),
    )
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch (error) {
    console.error("[JWT] Token verification failed:", error);
    return null;
  }
}

// Get authenticated user from request
export async function getAuthUser(
  request: NextRequest,
): Promise<AuthPayload | null> {
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Create auth cookie options
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: getExpiryInSeconds(JWT_EXPIRES_IN),
    path: "/",
  };
}
