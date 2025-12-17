"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HiChevronDown,
  HiChevronRight,
  HiFolder,
  HiFolderOpen,
} from "react-icons/hi";
import Loading from "@/app/components/Loading";

interface Service {
  id: string;
  name: string;
  serviceType: string;
  lastStatus?: "UP" | "DOWN";
  lastCheckedAt?: string;
  groupId?: string;
  avgResponseTime?: number;
  alertsEnabled?: boolean;
  throughput?: number;
}

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface GroupedServices {
  group: Group | null;
  services: Service[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAlerts, setTogglingAlerts] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["other"])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, groupsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/groups"),
      ]);

      if (servicesRes.ok && groupsRes.ok) {
        const servicesData = await servicesRes.json();
        const groupsData = await groupsRes.json();
        setServices(servicesData.services || []);
        setGroups(groupsData.groups || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = groups.map((g) => g.id).concat(["other"]);
    setExpandedFolders(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const toggleAlerts = async (serviceId: string, currentValue: boolean) => {
    // Optimistic update
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, alertsEnabled: !currentValue } : s
      )
    );

    setTogglingAlerts((prev) => new Set(prev).add(serviceId));

    try {
      const response = await fetch(`/api/services/${serviceId}/alerts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertsEnabled: !currentValue }),
      });

      if (!response.ok) {
        // Revert on error
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId ? { ...s, alertsEnabled: currentValue } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle alerts:", error);
      // Revert on error
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, alertsEnabled: currentValue } : s
        )
      );
    } finally {
      setTogglingAlerts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  // Group services
  const groupedServices: GroupedServices[] = [];

  // Add services by group
  groups.forEach((group) => {
    const groupServices = services.filter((s) => s.groupId === group.id);
    if (groupServices.length > 0) {
      groupedServices.push({ group, services: groupServices });
    }
  });

  // Add ungrouped services
  const ungroupedServices = services.filter((s) => !s.groupId);
  if (ungroupedServices.length > 0) {
    groupedServices.push({ group: null, services: ungroupedServices });
  }

  const stats = {
    total: services.length,
    healthy: services.filter((s) => s.lastStatus === "UP").length,
    down: services.filter((s) => s.lastStatus === "DOWN").length,
  };

  if (loading) {
    return <Loading message="Loading services..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Services</h1>
          <p className="text-gray-400">Manage and monitor your services</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/services/deleted"
            className="px-6 py-3 glass rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-smooth"
          >
            Deleted Services
          </Link>
          <Link
            href="/services/new"
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
          >
            Add Service
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Healthy</p>
          <p className="text-2xl font-bold text-[var(--color-status-up)]">
            {stats.healthy}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Down</p>
          <p className="text-2xl font-bold text-[var(--color-status-down)]">
            {stats.down}
          </p>
        </div>
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Service Groups</h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 glass rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-smooth"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 glass rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-smooth"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Grouped Services */}
      <div className="space-y-4">
        {groupedServices.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-400 mb-4">No services yet</p>
            <Link
              href="/services/new"
              className="inline-block px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
            >
              Add Your First Service
            </Link>
          </div>
        ) : (
          groupedServices.map((grouped) => {
            const folderId = grouped.group?.id || "other";
            const isExpanded = expandedFolders.has(folderId);
            const folderName = grouped.group?.name || "Other";
            const folderColor = grouped.group?.color || "#6b7280";

            return (
              <div key={folderId} className="glass rounded-2xl overflow-hidden">
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folderId)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <HiFolderOpen className="w-6 h-6 text-purple-400" />
                    ) : (
                      <HiFolder className="w-6 h-6 text-purple-400" />
                    )}
                    <div
                      className="w-1 h-6 rounded-full"
                      style={{ backgroundColor: folderColor }}
                    />
                    <span className="text-lg font-bold text-white">
                      {folderName}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({grouped.services.length}{" "}
                      {grouped.services.length === 1 ? "service" : "services"})
                    </span>
                  </div>
                  {isExpanded ? (
                    <HiChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <HiChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Services List */}
                {isExpanded && (
                  <div className="px-6 pb-4 space-y-2">
                    {grouped.services.map((service) => {
                      const isToggling = togglingAlerts.has(service.id);
                      const alertsEnabled =
                        service.alertsEnabled !== undefined
                          ? service.alertsEnabled
                          : true;

                      return (
                        <div
                          key={service.id}
                          className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-smooth group"
                        >
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/services/${service.id}`}
                              className="flex items-center gap-4 flex-1"
                            >
                              {/* Status Indicator */}
                              <div className="relative">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    service.lastStatus === "UP"
                                      ? "bg-[var(--color-status-up)]"
                                      : service.lastStatus === "DOWN"
                                      ? "bg-[var(--color-status-down)]"
                                      : "bg-gray-500"
                                  }`}
                                />
                                {service.lastStatus === "UP" && (
                                  <div className="absolute inset-0 w-3 h-3 bg-[var(--color-status-up)] rounded-full status-pulse" />
                                )}
                              </div>

                              {/* Service Info */}
                              <div className="flex-1">
                                <h3 className="text-white font-medium group-hover:gradient-text transition-smooth">
                                  {service.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {service.serviceType?.toUpperCase() ||
                                    "UNKNOWN"}
                                </p>
                              </div>
                            </Link>

                            {/* Alert Toggle and Metrics */}
                            <div className="flex items-center gap-6">
                              {/* Alert Toggle */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  Alerts
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleAlerts(service.id, alertsEnabled);
                                  }}
                                  disabled={isToggling}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    alertsEnabled
                                      ? "bg-purple-500"
                                      : "bg-gray-600"
                                  } ${
                                    isToggling ? "opacity-50 cursor-wait" : ""
                                  }`}
                                  title={
                                    alertsEnabled
                                      ? "Alerts enabled"
                                      : "Alerts disabled"
                                  }
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      alertsEnabled
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Metrics */}
                              <div className="flex items-center gap-6 text-sm">
                                {service.avgResponseTime !== undefined && (
                                  <div>
                                    <p className="text-gray-400">
                                      Response Time
                                    </p>
                                    <p className="text-white font-medium">
                                      {service.avgResponseTime.toFixed(0)}ms
                                    </p>
                                  </div>
                                )}
                                {service.lastCheckedAt && (
                                  <div>
                                    <p className="text-gray-400">Last Check</p>
                                    <p className="text-white font-medium">
                                      {new Date(
                                        service.lastCheckedAt
                                      ).toLocaleTimeString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
