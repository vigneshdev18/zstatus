"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiCheckCircle,
  HiChevronDown,
  HiChevronRight,
  HiExclamation,
  HiFolder,
  HiFolderOpen,
  HiServer,
  HiPlus,
} from "react-icons/hi";
import Loading from "@/app/components/Loading";
import apiClient from "@/lib/api/client";
import ServiceCard from "../components/ServiceCard";
import Button from "@/app/components/Button/Button";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { Grid, GridItem } from "../components/Grid";
import DetailCard from "../components/DetailsCard";

interface ServiceListType {
  id: string;
  name: string;
  serviceType: string;
  lastStatus?: "UP" | "DOWN";
  lastCheckedAt?: string;
  groupId?: string;
  avgResponseTime?: number;
  alertsEnabled?: boolean;
  throughput?: number;
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
  consecutiveSlowWarning?: number;
  consecutiveSlowCritical?: number;
  lastAlertType?: string;
  lastAlertSentAt?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface GroupedServices {
  group: Group | null;
  services: ServiceListType[];
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [togglingAlerts, setTogglingAlerts] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["other"]),
  );

  // Fetch user data
  const { data: userData } = useApiQuery("/api/auth/me");
  const user = userData?.user;

  // Fetch services using useApiQuery
  const { data: servicesData, isLoading: servicesLoading } =
    useApiQuery("/api/services");

  // Fetch groups using useApiQuery
  const { data: groupsData, isLoading: groupsLoading } =
    useApiQuery("/api/groups");

  const services = servicesData?.services || [];
  const groups = groupsData?.groups || [];
  const loading = servicesLoading || groupsLoading;

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
    const queryKey = ["api", "/api/services"];

    // Check if we have cached data
    const cachedData = queryClient.getQueryData<{
      services: ServiceListType[];
    }>(queryKey);

    setTogglingAlerts((prev) => new Set(prev).add(serviceId));

    try {
      if (cachedData) {
        // Optimistically update the cache
        queryClient.setQueryData<{ services: ServiceListType[] }>(
          queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              services: old.services.map((s) =>
                s.id === serviceId ? { ...s, alertsEnabled: !currentValue } : s,
              ),
            };
          },
        );
      }

      // Make the API call
      await apiClient.patch(`/api/services/${serviceId}/alerts`, {
        alertsEnabled: !currentValue,
      });

      // Invalidate and refetch to ensure consistency
      await queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      console.error("Failed to toggle alerts:", error);

      // Revert optimistic update in cache
      if (cachedData) {
        queryClient.setQueryData(queryKey, cachedData);
      }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Services</h1>
          <p className="text-gray-400">
            Monitor the health and performance of your infrastructure
          </p>
        </div>
        {user?.role !== "viewer" && (
          <div className="flex items-center gap-3">
            <Link
              href="/services/deleted"
              className="px-4 py-2 glass rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-smooth text-sm font-medium"
            >
              Deleted Services
            </Link>
            <Link
              href="/services/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-xl text-white hover:scale-105 transition-smooth shadow-gradient"
            >
              <HiPlus className="w-5 h-5" />
              <span>Add Service</span>
            </Link>
          </div>
        )}
      </div>

      <Grid cols={3}>
        <GridItem>
          <DetailCard
            title="Total"
            value={stats.total}
            icon={<HiServer className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-primary"
          />
        </GridItem>
        <GridItem>
          <DetailCard
            title="Healthy"
            value={stats.healthy}
            icon={<HiCheckCircle className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-success"
          />
        </GridItem>
        <GridItem>
          <DetailCard
            title="Down"
            value={stats.down}
            icon={<HiExclamation className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-danger"
          />
        </GridItem>
      </Grid>

      {/* Expand/Collapse Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Service Groups</h2>
        <div className="flex gap-2">
          <Button onClick={expandAll} variant="ghost" size="sm">
            Expand All
          </Button>
          <Button onClick={collapseAll} variant="ghost" size="sm">
            Collapse All
          </Button>
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
                    {grouped.services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isToggling={togglingAlerts.has(service.id)}
                        toggleAlerts={toggleAlerts}
                      />
                    ))}
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
