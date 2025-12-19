"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  HiViewGrid,
  HiServer,
  HiExclamation,
  HiChartBar,
  HiFolder,
  HiCog,
  HiBell,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import { useApiQuery } from "@/lib/hooks/useApiQuery";

const navigationSections = [
  {
    title: "Monitoring",
    items: [
      {
        name: "Overview",
        href: "/overview",
        icon: <HiViewGrid className="w-5 h-5" />,
      },
      {
        name: "Services",
        href: "/services",
        icon: <HiServer className="w-5 h-5" />,
      },
      {
        name: "Incidents",
        href: "/incidents",
        icon: <HiExclamation className="w-5 h-5" />,
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: <HiChartBar className="w-5 h-5" />,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        name: "Groups",
        href: "/groups",
        icon: <HiFolder className="w-5 h-5" />,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: <HiCog className="w-5 h-5" />,
      },
    ],
  },
];

interface Settings {
  globalHealthChecksEnabled: boolean;
  globalAlertsEnabled: boolean;
}

interface Service {
  id: string;
  name: string;
  alertsEnabled: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [showAlertsList, setShowAlertsList] = useState(false);

  // Fetch settings using useApiQuery
  const { data: settingsResponse, isLoading: settingsLoading } = useApiQuery<{
    settings: Settings;
  }>("/api/settings", {
    // Refetch when pathname changes to keep data fresh
    refetchOnMount: true,
  });
  const settings = settingsResponse?.settings;

  // Fetch services only if global alerts are enabled
  const { data: servicesData } = useApiQuery<{ services: Service[] }>(
    "/api/services",
    {
      // Only fetch if global alerts are enabled
      enabled: settings?.globalAlertsEnabled === true,
      refetchOnMount: true,
    }
  );

  // Filter services with alerts disabled
  const servicesWithAlertsDisabled = useMemo(() => {
    if (!servicesData?.services) return [];
    return servicesData.services.filter(
      (service) => service.alertsEnabled === false
    );
  }, [servicesData]);

  const loading = settingsLoading;

  // Determine system status
  const getSystemStatus = () => {
    if (loading || !settings)
      return { text: "Loading...", color: "gray", pulse: false };

    if (!settings.globalHealthChecksEnabled) {
      return {
        text: "Monitoring Disabled",
        color: "gray-500",
        pulse: false,
      };
    }

    return {
      text: "Operational",
      color: "[var(--color-status-up)]",
      pulse: true,
    };
  };

  const status = getSystemStatus();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-[var(--color-border)] flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <Link href="/overview" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Z</span>
          </div>
          <span className="text-xl font-bold gradient-text">ZStatus</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth
                      ${
                        isActive
                          ? "bg-gradient-primary text-white shadow-gradient"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status & Alerts Section */}
      <div className="p-4 border-t border-[var(--color-border)] space-y-3">
        {/* System Status */}
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-2 h-2 bg-${status.color} rounded-full`}></div>
              {status.pulse && (
                <div
                  className={`absolute inset-0 w-2 h-2 bg-${status.color} rounded-full status-pulse`}
                ></div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400">System Status</p>
              <p className="text-sm font-medium text-white">{status.text}</p>
            </div>
          </div>
        </div>

        {/* Global Alerts Disabled Indicator */}
        {settings && !settings.globalAlertsEnabled && (
          <div className="glass rounded-lg p-3 border border-yellow-500/20 bg-yellow-500/10">
            <div className="flex items-center gap-2">
              <HiBell className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-xs font-medium text-yellow-400">
                  Global Alerts Disabled
                </p>
                <p className="text-xs text-gray-400">
                  No notifications will be sent
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Services with Alerts Disabled */}
        {settings &&
          settings.globalAlertsEnabled &&
          servicesWithAlertsDisabled.length > 0 && (
            <div className="glass rounded-lg overflow-hidden">
              <button
                onClick={() => setShowAlertsList(!showAlertsList)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-smooth"
              >
                <div className="flex items-center gap-2">
                  <HiBell className="w-4 h-4 text-orange-400" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-orange-400">
                      Alerts Disabled ({servicesWithAlertsDisabled.length})
                    </p>
                    <p className="text-xs text-gray-400">
                      Services not alerting
                    </p>
                  </div>
                </div>
                {showAlertsList ? (
                  <HiChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <HiChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showAlertsList && (
                <div className="border-t border-white/10 max-h-48 overflow-y-auto">
                  {servicesWithAlertsDisabled.map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.id}`}
                      className="block px-3 py-2 hover:bg-white/5 transition-smooth border-b border-white/5 last:border-b-0"
                    >
                      <p className="text-xs text-gray-300 truncate">
                        {service.name}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </aside>
  );
}
