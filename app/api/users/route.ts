import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { getAllUsers, createUserByAdmin } from "@/lib/db/users";

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get all users
    const users = await getAllUsers();

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
    });
  } catch (error) {
    console.error("[API] Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = "viewer" } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== "admin" && role !== "viewer") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'viewer'" },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUserByAdmin(email, role);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[API] Error in POST /api/users:", error);

    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
