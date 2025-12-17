"use client";

import { useState, useEffect } from "react";
import Loading from "@/app/components/Loading";

export default function SettingsPage() {
  const [globalAlertsEnabled, setGlobalAlertsEnabled] = useState(true);
  const [togglingGlobalAlerts, setTogglingGlobalAlerts] = useState(false);
  const [globalHealthChecksEnabled, setGlobalHealthChecksEnabled] =
    useState(true);
  const [togglingHealthChecks, setTogglingHealthChecks] = useState(false);
  const [alertCooldownMinutes, setAlertCooldownMinutes] = useState(5);
  const [savingCooldown, setSavingCooldown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setGlobalAlertsEnabled(data.settings.globalAlertsEnabled);
        setGlobalHealthChecksEnabled(
          data.settings.globalHealthChecksEnabled ?? true
        );
        setAlertCooldownMinutes(data.settings.alertCooldownMinutes || 5);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGlobalAlerts = async () => {
    const currentValue = globalAlertsEnabled;
    // Optimistic update
    setGlobalAlertsEnabled(!currentValue);
    setTogglingGlobalAlerts(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalAlertsEnabled: !currentValue }),
      });

      if (!response.ok) {
        // Revert on error
        setGlobalAlertsEnabled(currentValue);
      }
    } catch (error) {
      console.error("Failed to toggle global alerts:", error);
      // Revert on error
      setGlobalAlertsEnabled(currentValue);
    } finally {
      setTogglingGlobalAlerts(false);
    }
  };

  const toggleGlobalHealthChecks = async () => {
    const currentValue = globalHealthChecksEnabled;
    // Optimistic update
    setGlobalHealthChecksEnabled(!currentValue);
    setTogglingHealthChecks(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalHealthChecksEnabled: !currentValue }),
      });

      if (!response.ok) {
        // Revert on error
        setGlobalHealthChecksEnabled(currentValue);
      }
    } catch (error) {
      console.error("Failed to toggle global health checks:", error);
      // Revert on error
      setGlobalHealthChecksEnabled(currentValue);
    } finally {
      setTogglingHealthChecks(false);
    }
  };

  const saveAlertCooldown = async () => {
    setSavingCooldown(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertCooldownMinutes }),
      });

      if (!response.ok) {
        console.error("Failed to save alert cooldown");
      }
    } catch (error) {
      console.error("Failed to save alert cooldown:", error);
    } finally {
      setSavingCooldown(false);
    }
  };

  if (loading) {
    return <Loading message="Loading settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
        <p className="text-gray-400">Configure global application settings</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Alerts Section */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Alert Settings</h2>

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
                <button
                  onClick={toggleGlobalHealthChecks}
                  disabled={togglingHealthChecks}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    globalHealthChecksEnabled ? "bg-purple-500" : "bg-gray-600"
                  } ${togglingHealthChecks ? "opacity-50 cursor-wait" : ""}`}
                  title={
                    globalHealthChecksEnabled
                      ? "Health checks enabled"
                      : "Health checks disabled"
                  }
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      globalHealthChecksEnabled
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium min-w-[70px] ${
                    globalHealthChecksEnabled
                      ? "text-purple-400"
                      : "text-gray-500"
                  }`}
                >
                  {globalHealthChecksEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Warning when health checks disabled */}
            {!globalHealthChecksEnabled && (
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
                <button
                  onClick={toggleGlobalAlerts}
                  disabled={togglingGlobalAlerts}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    globalAlertsEnabled ? "bg-purple-500" : "bg-gray-600"
                  } ${togglingGlobalAlerts ? "opacity-50 cursor-wait" : ""}`}
                  title={
                    globalAlertsEnabled
                      ? "Global alerts enabled"
                      : "Global alerts disabled"
                  }
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      globalAlertsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium min-w-[70px] ${
                    globalAlertsEnabled ? "text-purple-400" : "text-gray-500"
                  }`}
                >
                  {globalAlertsEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Warning when disabled */}
            {!globalAlertsEnabled && (
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cooldown (minutes)
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Minimum time between consecutive alerts for the same service
                  </p>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={alertCooldownMinutes}
                    onChange={(e) =>
                      setAlertCooldownMinutes(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={saveAlertCooldown}
                  disabled={savingCooldown}
                  className="px-6 py-2 bg-gradient-primary rounded-lg text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-wait"
                >
                  {savingCooldown ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Future Settings Sections */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            General Settings
          </h2>
          <p className="text-gray-400 text-sm">
            Additional settings will be available here in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
