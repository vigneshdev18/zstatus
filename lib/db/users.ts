import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  id: string;
  email: string;
  name?: string;
  role: "admin" | "viewer";
  createdAt: Date;
  lastLoginAt: Date;
}

const USERS_COLLECTION = "users";

// Create a new user
export async function createUser(email: string): Promise<User> {
  const db = await getDatabase();

  const user: User = {
    _id: new ObjectId(),
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    role: "admin", // First user is admin, can be changed later
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  await db.collection<User>(USERS_COLLECTION).insertOne(user);
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  const user = await db
    .collection<User>(USERS_COLLECTION)
    .findOne({ email: email.toLowerCase() });

  return user;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.collection<User>(USERS_COLLECTION).findOne({ id });

  return user;
}

// Update last login timestamp
export async function updateLastLogin(userId: string): Promise<void> {
  const db = await getDatabase();
  await db
    .collection<User>(USERS_COLLECTION)
    .updateOne({ id: userId }, { $set: { lastLoginAt: new Date() } });
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  const db = await getDatabase();
  const users = await db
    .collection<User>(USERS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return users;
}

// Create user by admin
export async function createUserByAdmin(
  email: string,
  role: "admin" | "viewer" = "viewer",
): Promise<User> {
  const db = await getDatabase();

  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const user: User = {
    _id: new ObjectId(),
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    role,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  await db.collection<User>(USERS_COLLECTION).insertOne(user);
  return user;
}

// Delete user
export async function deleteUser(userId: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .collection<User>(USERS_COLLECTION)
    .deleteOne({ id: userId });

  return result.deletedCount > 0;
}

// Update user role
export async function updateUserRole(
  userId: string,
  role: "admin" | "viewer",
): Promise<User | null> {
  const db = await getDatabase();
  const result = await db
    .collection<User>(USERS_COLLECTION)
    .findOneAndUpdate(
      { id: userId },
      { $set: { role } },
      { returnDocument: "after" },
    );

  return result || null;
}
