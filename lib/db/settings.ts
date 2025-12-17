import { getDatabase } from "@/lib/mongodb";
import { Settings, UpdateSettingsInput } from "@/lib/types/settings";

const SETTINGS_ID = "global"; // Singleton document ID

// Get global settings (creates default if not exists)
export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const collection = db.collection<Settings>("settings");

  let settings = (await collection.findOne({ id: SETTINGS_ID })) as Settings;

  // Create default settings if not exists
  if (!settings) {
    const defaultSettings: Settings = {
      id: SETTINGS_ID,
      globalAlertsEnabled: true, // Alerts enabled by default
      globalHealthChecksEnabled: true, // Health checks enabled by default
      alertCooldownMinutes: 5, // 5 minutes default cooldown
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(defaultSettings);
    settings = defaultSettings;
  } else {
    // Migrate existing settings to include new fields if missing
    let needsUpdate = false;
    const updates: any = {};

    if (settings.globalHealthChecksEnabled === undefined) {
      updates.globalHealthChecksEnabled = true;
      needsUpdate = true;
    }

    if (settings.alertCooldownMinutes === undefined) {
      updates.alertCooldownMinutes = 5;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await collection.updateOne(
        { id: SETTINGS_ID },
        { $set: { ...updates, updatedAt: new Date() } }
      );
      // Refetch to get updated document
      settings = (await collection.findOne({ id: SETTINGS_ID })) as Settings;
    }
  }

  return settings;
}

// Update global settings
export async function updateSettings(
  input: UpdateSettingsInput
): Promise<Settings> {
  const db = await getDatabase();
  const collection = db.collection<Settings>("settings");

  // Ensure settings document exists
  await getSettings();

  // Filter out undefined values to only update provided fields
  const updateFields: any = {};
  if (input.globalAlertsEnabled !== undefined) {
    updateFields.globalAlertsEnabled = input.globalAlertsEnabled;
  }
  if (input.globalHealthChecksEnabled !== undefined) {
    updateFields.globalHealthChecksEnabled = input.globalHealthChecksEnabled;
  }
  if (input.alertCooldownMinutes !== undefined) {
    updateFields.alertCooldownMinutes = input.alertCooldownMinutes;
  }

  // Update settings
  const result = await collection.findOneAndUpdate(
    { id: SETTINGS_ID },
    {
      $set: {
        ...updateFields,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update settings");
  }

  return result as Settings;
}
