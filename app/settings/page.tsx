"use client";

import { useState, useEffect } from "react";
import Loading from "@/app/components/Loading";
import Switch from "@/app/components/Switch/Switch";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import PageHeader from "../components/PageHeader";
import InputField from "../components/Input/Input";

interface Settings {
  globalAlertsEnabled?: boolean;
  globalHealthChecksEnabled?: boolean;
  alertCooldownMinutes?: number;
}

export default function SettingsPage() {
  const [alertCooldownMinutes, setAlertCooldownMinutes] = useState(5);

  // Fetch settings using useApiQuery
  const { data: settingsResponse, isLoading } = useApiQuery("/api/settings");

  const settings = settingsResponse?.settings;

  // Update local cooldown state when settings load
  useEffect(() => {
    if (settings?.alertCooldownMinutes) {
      setAlertCooldownMinutes(settings.alertCooldownMinutes);
    }
  }, [settings]);

  // Mutation for updating settings
  const updateSettings = useApiMutation({
    url: "/api/settings",
    method: "PATCH",
    invalidateQueries: [["api", "/api/settings"]],
  });

  const toggleGlobalAlerts = () => {
    if (!settings) return;
    updateSettings.mutate({
      globalAlertsEnabled: !settings.globalAlertsEnabled,
    });
  };

  const toggleGlobalHealthChecks = () => {
    if (!settings) return;
    updateSettings.mutate({
      globalHealthChecksEnabled: !settings.globalHealthChecksEnabled,
    });
  };

  const saveAlertCooldown = () => {
    updateSettings.mutate({ alertCooldownMinutes });
  };

  if (isLoading || !settings) {
    return <Loading message="Loading settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Configure global application settings"
        showBack={false}
      />

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Alerts Section */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            General Settings
          </h2>

          {/* Global Alerts Toggle */}
          <div className="space-y-4">
            {/* Global Health Checks Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">
                  Global Health Checks
                </h3>
                <p className="text-sm text-gray-400">
                  Master switch for all health check monitoring. When disabled,
                  no health checks will run and services won't be monitored.
                </p>
              </div>
              <div className="flex items-center gap-4 ml-6">
                <Switch
                  checked={settings.globalHealthChecksEnabled}
                  onChange={toggleGlobalHealthChecks}
                  disabled={updateSettings.isPending}
                  label={
                    settings.globalHealthChecksEnabled ? "Enabled" : "Disabled"
                  }
                  labelPosition="right"
                />
              </div>
            </div>

            {/* Warning when health checks disabled */}
            {!settings.globalHealthChecksEnabled && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🛑</span>
                  <div>
                    <p className="text-red-400 font-medium mb-1">
                      Health Checks Disabled
                    </p>
                    <p className="text-sm text-gray-400">
                      All health check monitoring is currently disabled. Your
                      services are NOT being monitored and incidents will not be
                      detected.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">
                  Global Alerts
                </h3>
                <p className="text-sm text-gray-400">
                  Master switch for all alert notifications. When disabled, no
                  alerts will be sent regardless of individual service settings.
                </p>
              </div>
              <div className="flex items-center gap-4 ml-6">
                <Switch
                  checked={settings.globalAlertsEnabled}
                  onChange={toggleGlobalAlerts}
                  disabled={updateSettings.isPending}
                  label={settings.globalAlertsEnabled ? "Enabled" : "Disabled"}
                  labelPosition="right"
                />
              </div>
            </div>

            {/* Warning when disabled */}
            {!settings.globalAlertsEnabled && (
              <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-medium mb-1">
                      Global Alerts Disabled
                    </p>
                    <p className="text-sm text-gray-400">
                      All alert notifications are currently disabled
                      system-wide. Your services are still being monitored, but
                      you won&apos;t receive any notifications when issues
                      occur.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Cooldown Setting */}
            <div className="p-4 bg-white/5 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-1">
                Alert Cooldown Period
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Minimum delay between consecutive alerts for the same service.
                Prevents alert spam during ongoing incidents.
              </p>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Cooldown (minutes)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Minimum time between consecutive alerts for the same service
                  </p>

                  <InputField
                    min="0"
                    step="1"
                    value={alertCooldownMinutes}
                    onChange={(e) =>
                      setAlertCooldownMinutes(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <button
                  onClick={saveAlertCooldown}
                  disabled={updateSettings.isPending}
                  className="px-6 py-2 bg-gradient-primary rounded-lg text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-wait"
                >
                  {updateSettings.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
