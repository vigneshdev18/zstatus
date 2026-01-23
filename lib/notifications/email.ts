import nodemailer from "nodemailer";
import { isEmailEnabled } from "@/lib/constants/app.constants";

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_KEY,
  },
});

const FROM_EMAIL = process.env.EMAIL_ID || "noreply@example.com";
const FROM_NAME = "ZStatus Admin";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Nodemailer
 * Respects the global ENABLE_EMAILS flag
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if emails are enabled globally (system-wide dev flag)
    if (!isEmailEnabled) {
      console.log(
        `[Email] Sending disabled by ENABLE_EMAILS flag. Subject: "${subject}" To: ${to}`,
      );
      return { success: true };
    }

    // Send email
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent email to ${to} with subject: "${subject}"`);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
