import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth/otp";
import { getOrCreateUser, updateLastLogin } from "@/lib/db/users";
import { generateToken, getAuthCookieOptions } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await verifyOTP(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Verification failed" },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(email);

    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Please contact your administrator." },
        { status: 404 }
      );
    }

    // Update last login
    await updateLastLogin(user.id);

    // Generate JWT token
    const token = await generateToken(user);

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, getAuthCookieOptions());

    return response;
  } catch (error) {
    console.error("[API] Error in verify-otp:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
