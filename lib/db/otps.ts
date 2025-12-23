import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface OTP {
  _id: ObjectId;
  email: string;
  code: string; // hashed
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const OTPS_COLLECTION = "otp";
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

// Create a new OTP
export async function createOTP(
  email: string,
  hashedCode: string
): Promise<OTP> {
  const db = await getDatabase();

  // Delete any existing OTPs for this email
  await db.collection<OTP>(OTPS_COLLECTION).deleteMany({
    email: email.toLowerCase(),
  });

  const otp: OTP = {
    _id: new ObjectId(),
    email: email.toLowerCase(),
    code: hashedCode,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    verified: false,
    attempts: 0,
    createdAt: new Date(),
  };

  await db.collection<OTP>(OTPS_COLLECTION).insertOne(otp);
  return otp;
}

// Get OTP by email
export async function getOTP(email: string): Promise<OTP | null> {
  const db = await getDatabase();
  const otp = await db.collection<OTP>(OTPS_COLLECTION).findOne({
    email: email.toLowerCase(),
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  return otp;
}

// Increment OTP attempts
export async function incrementOTPAttempts(email: string): Promise<void> {
  const db = await getDatabase();
  await db
    .collection<OTP>(OTPS_COLLECTION)
    .updateOne({ email: email.toLowerCase() }, { $inc: { attempts: 1 } });
}

// Mark OTP as verified
export async function markOTPAsVerified(email: string): Promise<void> {
  const db = await getDatabase();
  await db
    .collection<OTP>(OTPS_COLLECTION)
    .updateOne({ email: email.toLowerCase() }, { $set: { verified: true } });
}

// Check if max attempts reached
export async function isMaxAttemptsReached(email: string): Promise<boolean> {
  const otp = await getOTP(email);
  return otp ? otp.attempts >= MAX_ATTEMPTS : false;
}

// Cleanup expired OTPs (run periodically)
export async function cleanupExpiredOTPs(): Promise<number> {
  const db = await getDatabase();
  const result = await db
    .collection<OTP>(OTPS_COLLECTION)
    .deleteMany({ expiresAt: { $lt: new Date() } });

  return result.deletedCount;
}

// Check rate limiting: max 3 OTP requests per hour per email
export async function checkRateLimit(email: string): Promise<boolean> {
  const db = await getDatabase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await db.collection<OTP>(OTPS_COLLECTION).countDocuments({
    email: email.toLowerCase(),
    createdAt: { $gt: oneHourAgo },
  });

  return count < 3; // Allow if less than 3 requests in last hour
}
