import bcrypt from "bcryptjs";
import {
  createOTP,
  getOTP,
  incrementOTPAttempts,
  markOTPAsVerified,
  checkRateLimit,
  isMaxAttemptsReached,
} from "@/lib/db/otps";
import { getUserByEmail } from "@/lib/db/users";
import { sendEmail } from "@/lib/notifications/email";

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP code
export async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

// Verify OTP code
export async function verifyOTPCode(
  code: string,
  hashedCode: string,
): Promise<boolean> {
  return bcrypt.compare(code, hashedCode);
}

// Send OTP via email
export async function sendOTP(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if user exists (whitelist check)
    const user = await getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        error: "Account not found. Please contact your administrator.",
      };
    }

    // Check rate limiting
    const canSend = await checkRateLimit(email);
    if (!canSend) {
      return {
        success: false,
        error: "Too many OTP requests. Please try again later.",
      };
    }

    // Generate OTP
    const code = generateOTP();
    const hashedCode = await hashOTP(code);

    // Store in database
    await createOTP(email, hashedCode);
    console.log("[Current OTP]", code);

    // Send email using shared service
    const emailResult = await sendEmail({
      to: email,
      subject: "Your ZStatus Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">ZStatus Login</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #1f2937;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Failed to send OTP email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[OTP] Error sending OTP:", error);
    return {
      success: false,
      error: "Failed to send OTP. Please try again.",
    };
  }
}

// Verify OTP
export async function verifyOTP(
  email: string,
  code: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if max attempts reached
    const maxReached = await isMaxAttemptsReached(email);
    if (maxReached) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code.",
      };
    }

    // Get OTP from database
    const otp = await getOTP(email);

    if (!otp) {
      return {
        success: false,
        error: "Invalid or expired code. Please request a new one.",
      };
    }

    // Verify code
    const isValid = await verifyOTPCode(code, otp.code);

    if (!isValid) {
      // Increment attempts
      await incrementOTPAttempts(email);
      return {
        success: false,
        error: "Invalid code. Please try again.",
      };
    }

    // Mark as verified
    await markOTPAsVerified(email);

    return { success: true };
  } catch (error) {
    console.error("[OTP] Error verifying OTP:", error);
    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  }
}
