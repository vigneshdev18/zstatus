// Global application settings
export interface Settings {
  id: string; // Always "global" for singleton pattern
  globalAlertsEnabled: boolean; // Master switch for all alerts
  globalHealthChecksEnabled: boolean; // Master switch for all health checks
  alertCooldownMinutes: number; // Minimum delay between alerts for same service (in minutes)
  createdAt: Date;
  updatedAt: Date;
}

// Input for updating settings
export interface UpdateSettingsInput {
  globalAlertsEnabled?: boolean;
  globalHealthChecksEnabled?: boolean;
  alertCooldownMinutes?: number;
}
