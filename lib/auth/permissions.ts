import { NextRequest } from "next/server";
import { getAuthUser } from "./jwt";

// Check if user is admin
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  return user?.role === "admin";
}

// Require admin role - throws error if not admin
export async function requireAdmin(request: NextRequest): Promise<void> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Error("Not authenticated");
  }

  if (user.role !== "admin") {
    throw new Error("Forbidden - Admin access required");
  }
}

// Get user role from request
export async function getUserRole(
  request: NextRequest
): Promise<"admin" | "viewer" | null> {
  const user = await getAuthUser(request);
  return (user?.role as "admin" | "viewer") || null;
}
