import { Service } from "@/lib/types/service";
import Link from "next/link";
import { HiPencil } from "react-icons/hi";
import Switch from "@/app/components/Switch/Switch";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Fragment } from "react";

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

const ServiceCard = ({
  service,
  isToggling,
  toggleAlerts,
}: {
  service: ServiceListType;
  isToggling: boolean;
  toggleAlerts: (serviceId: string, currentValue: boolean) => Promise<void>;
}) => {
  const { user } = useAuth();
  const alertsEnabled =
    service.alertsEnabled !== undefined ? service.alertsEnabled : true;

  return (
    <div
      key={service.id}
      className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-smooth group"
    >
      <div className="space-y-3">
        {/* Main Row */}
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
                {service.serviceType?.toUpperCase() || "UNKNOWN"}
              </p>
            </div>
          </Link>

          {/* Actions and Metrics */}
          <div className="flex items-center gap-6">
            {/* Edit Button */}
            {user?.role !== "viewer" && (
              <Fragment>
                <Link
                  href={`/services/${service.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 glass rounded-lg hover:bg-white/10 transition-smooth"
                  title="Edit service"
                >
                  <HiPencil className="w-4 h-4 text-gray-400 hover:text-white" />
                </Link>

                {/* Alert Toggle */}
                <Switch
                  checked={alertsEnabled}
                  onChange={() => toggleAlerts(service.id, alertsEnabled)}
                  disabled={isToggling}
                  label="Alerts"
                  labelPosition="left"
                  size="sm"
                />
              </Fragment>
            )}
            {/* Metrics */}
            <div className="flex items-center gap-6 text-sm">
              {service.avgResponseTime !== undefined &&
                service.avgResponseTime !== null && (
                  <div>
                    <p className="text-gray-400">Response Time</p>
                    <p className="text-white font-medium">
                      {service.avgResponseTime.toFixed(0)}ms
                    </p>
                  </div>
                )}
              {service.lastCheckedAt && (
                <div>
                  <p className="text-gray-400">Last Check</p>
                  <p className="text-white font-medium">
                    {new Date(service.lastCheckedAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Response Time Alert Settings & Status */}
        {(service.responseTimeWarningMs ||
          service.responseTimeCriticalMs ||
          service.lastAlertSentAt) && (
          <div className="flex items-center justify-between text-xs pl-7 pt-2 border-t border-white/5">
            {/* Alert Configuration */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500">Response Time Alerts:</span>
              {service.responseTimeWarningMs && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚠️ Warning:</span>
                  <span className="text-gray-300">
                    {service.responseTimeWarningMs}ms
                  </span>
                  <span className="text-gray-500">
                    ({service.responseTimeWarningAttempts || 3} attempts)
                  </span>
                  {service.consecutiveSlowWarning !== undefined &&
                    service.consecutiveSlowWarning > 0 && (
                      <span className="text-yellow-300 font-medium">
                        [{service.consecutiveSlowWarning}/
                        {service.responseTimeWarningAttempts || 3}]
                      </span>
                    )}
                </div>
              )}
              {service.responseTimeCriticalMs && (
                <div className="flex items-center gap-2">
                  <span className="text-red-400">🔴 Critical:</span>
                  <span className="text-gray-300">
                    {service.responseTimeCriticalMs}ms
                  </span>
                  <span className="text-gray-500">
                    ({service.responseTimeCriticalAttempts || 3} attempts)
                  </span>
                  {service.consecutiveSlowCritical !== undefined &&
                    service.consecutiveSlowCritical > 0 && (
                      <span className="text-red-300 font-medium">
                        [{service.consecutiveSlowCritical}/
                        {service.responseTimeCriticalAttempts || 3}]
                      </span>
                    )}
                </div>
              )}
            </div>

            {/* Last Alert Sent */}
            {service.lastAlertSentAt && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Last Alert:</span>
                <span
                  className={`font-medium ${
                    service.lastAlertType === "INCIDENT_OPENED"
                      ? "text-red-400"
                      : service.lastAlertType === "INCIDENT_CLOSED"
                        ? "text-green-400"
                        : service.lastAlertType === "RESPONSE_TIME"
                          ? "text-yellow-400"
                          : "text-gray-400"
                  }`}
                >
                  {service.lastAlertType?.replace("_", " ")}
                </span>
                <span className="text-gray-400">
                  {new Date(service.lastAlertSentAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
