"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useApiQuery, usePagination } from "@/lib/hooks";
import DeleteServiceButton from "@/app/components/DeleteServiceButton";
import RefreshServiceButton from "@/app/components/RefreshServiceButton";
import { Tabs } from "@/app/components/Tabs";
import { Grid, GridItem } from "@/app/components/Grid";
import PageHeader from "@/app/components/PageHeader";
import {
  HealthChecksTab,
  AlertsTab,
  ServiceDetailSkeleton,
} from "@/app/components/service";

interface Service {
  id: string;
  name: string;
  healthCheckUrl: string;
  timeout: number;
  checkInterval: number;
  description?: string;
  team?: string;
  owner?: string;
  lastStatus?: "UP" | "DOWN";
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Fetch service details
  const { data: serviceData, isLoading: serviceLoading } = useApiQuery<{
    service: Service;
  }>(`/api/services/${id}`);

  const service = serviceData?.service;

  // NOW we can do conditional logic
  if (serviceLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    notFound();
  }

  return (
    <div className="h-[93vh] flex flex-col px-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={service.name}
          subtitle="Service monitoring dashboard"
        />

        <div className="flex items-center gap-3">
          <RefreshServiceButton serviceId={id} />
          <Link
            href={`/services/${id}/edit`}
            className="px-4 py-2 glass rounded-lg text-white hover:bg-white/10 transition-smooth"
          >
            Edit
          </Link>
          <Link
            href={`/services/${id}/incidents`}
            className="px-4 py-2 bg-gradient-primary rounded-lg text-white hover:scale-105 transition-smooth shadow-gradient"
          >
            View Incidents
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 overflow-hidden">
        <Grid cols={3} gap={6} className="h-full">
          {/* Left Column - Service Details */}
          <GridItem className="flex flex-col gap-6 overflow-y-auto pr-2">
            {/* Status Card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Current Status</h2>
                <div
                  className={`
                  px-4 py-2 rounded-full font-medium flex items-center gap-2
                  ${
                    service.lastStatus === "UP"
                      ? "bg-gradient-success text-white"
                      : "bg-gradient-danger text-white"
                  }
                `}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      service.lastStatus === "UP" ? "bg-white" : "bg-white"
                    }`}
                  ></div>
                  {service.lastStatus || "PENDING"}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Health Check URL</p>
                  <p className="text-white font-mono text-sm break-all">
                    {service.healthCheckUrl}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Timeout</p>
                    <p className="text-white font-medium">
                      {service.timeout}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Check Interval</p>
                    <p className="text-white font-medium">
                      {service.checkInterval}s
                    </p>
                  </div>
                </div>
              </div>

              {service.description && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Description</p>
                  <p className="text-white">{service.description}</p>
                </div>
              )}

              {(service.team || service.owner) && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3">Ownership</p>
                  <div className="grid grid-cols-2 gap-4">
                    {service.team && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Team</p>
                        <p className="text-white font-medium">{service.team}</p>
                      </div>
                    )}
                    {service.owner && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Owner</p>
                        <p className="text-white font-medium">
                          {service.owner}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="glass rounded-2xl p-6 border border-red-500/20">
              <h2 className="text-xl font-bold text-red-400 mb-4">
                Danger Zone
              </h2>
              <p className="text-gray-400 mb-4">
                Deleting this service will remove all associated health checks
                and incident history. This action cannot be undone.
              </p>
              <DeleteServiceButton serviceId={id} serviceName={service.name} />
            </div>
          </GridItem>

          {/* Right Column - Tabs with Health Checks and Alerts */}
          <GridItem colSpan={2} className="overflow-hidden">
            <div className="glass rounded-2xl p-6 h-full flex flex-col">
              <Tabs
                tabs={[
                  {
                    id: "health-checks",
                    label: "Recent Health Checks",
                    content: <HealthChecksTab serviceId={id} />,
                  },
                  {
                    id: "alerts",
                    label: "All Alerts",
                    content: <AlertsTab serviceId={id} />,
                  },
                ]}
                defaultTab="health-checks"
              />
            </div>
          </GridItem>
        </Grid>
      </div>
    </div>
  );
}
