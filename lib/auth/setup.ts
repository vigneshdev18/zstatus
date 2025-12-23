import { createUserByAdmin, getUserByEmail } from "@/lib/db/users";

const DEFAULT_ADMIN_EMAIL =
  process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";

// Ensure default admin user exists
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    // Check if default admin exists
    const existingAdmin = await getUserByEmail(DEFAULT_ADMIN_EMAIL);

    if (!existingAdmin) {
      // Create default admin
      await createUserByAdmin(DEFAULT_ADMIN_EMAIL, "admin");
      console.log(
        `[Setup] Created default admin account: ${DEFAULT_ADMIN_EMAIL}`
      );
    } else {
      console.log(
        `[Setup] Default admin already exists: ${DEFAULT_ADMIN_EMAIL}`
      );
    }
  } catch (error) {
    console.error("[Setup] Error ensuring default admin:", error);
  }
}
