import Link from "next/link";
import { getIncidentById } from "@/lib/db/incidents";
import { getServiceById } from "@/lib/db/services";
import { getCorrelatedIncidents } from "@/lib/db/incident-correlation";
import { notFound } from "next/navigation";
import { getObservabilityLinks } from "@/lib/observability/links";
import IncidentTimeline from "@/app/components/IncidentTimeline";
import { formatDuration } from "@/lib/utils/format";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incident = await getIncidentById(id);

  if (!incident) {
    notFound();
  }

  const service = await getServiceById(incident.serviceId);

  let correlatedIncidents: any[] = [];
  if (incident.correlationId) {
    const allCorrelated = await getCorrelatedIncidents(incident.correlationId);
    correlatedIncidents = allCorrelated.filter((inc) => inc.id !== incident.id);
  }

  const observabilityLinks = getObservabilityLinks({
    serviceName: incident.serviceName,
    startTime: incident.startTime,
    endTime: incident.endTime,
    dashboardId: service?.grafanaDashboardId,
  });

  const duration = incident.duration
    ? Math.round(incident.duration / 1000)
    : incident.endTime
      ? Math.round(
          (incident.endTime.getTime() - incident.startTime.getTime()) / 1000,
        )
      : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/incidents"
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Incidents
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold gradient-text">
            {incident.serviceName}
          </h1>
          <span
            className={`
            px-4 py-2 rounded-full text-sm font-medium
            ${
              incident.status === "OPEN"
                ? "bg-gradient-danger text-white"
                : "bg-gradient-success text-white"
            }
          `}
          >
            {incident.status}
          </span>
        </div>
        <p className="text-gray-400">Incident timeline and details</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Started</p>
          <p className="text-sm text-white font-medium">
            {incident.startTime.toLocaleString()}
          </p>
        </div>
        {incident.endTime && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Resolved</p>
            <p className="text-sm text-white font-medium">
              {incident.endTime.toLocaleString()}
            </p>
          </div>
        )}
        {duration && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Duration</p>
            {typeof incident.duration == "number" && (
              <p className="text-sm text-white font-medium">
                {formatDuration(incident.duration)}
              </p>
            )}
          </div>
        )}
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Failed Checks</p>
          <p className="text-sm text-white font-medium">
            {incident.failedChecks}
          </p>
        </div>
      </div>

      {/* Correlation Info */}
      {incident.isCorrelated && (
        <div
          className={`
          glass rounded-2xl p-6 border-l-4
          ${
            incident.rootCauseServiceId === incident.serviceId
              ? "border-red-500"
              : "border-orange-500"
          }
        `}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {incident.rootCauseServiceId === incident.serviceId
                  ? "🔴 Root Cause Incident"
                  : "🟠 Correlated Incident"}
              </h2>
              <p className="text-gray-400 text-sm">
                {incident.rootCauseServiceId === incident.serviceId
                  ? "This incident is identified as the root cause of a cascade failure"
                  : "This incident is impacted by a failure in another service"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incident Timeline */}
      {(incident.isCorrelated || correlatedIncidents.length > 0) && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Incident Timeline
          </h2>
          <IncidentTimeline
            incident={incident}
            correlatedIncidents={correlatedIncidents}
          />
        </div>
      )}

      {/* Observability Links */}
      {observabilityLinks.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            View in Observability Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {observabilityLinks.map((link) => (
              <a
                key={link.type}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-smooth border border-white/10 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium group-hover:text-purple-300 transition-smooth">
                      {link.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      View in {link.type}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-smooth"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Service Ownership */}
      {(service?.team || service?.owner) && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Service Ownership
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {service.team && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Team</p>
                <p className="text-white font-medium">{service.team}</p>
              </div>
            )}
            {service.owner && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Owner</p>
                <p className="text-white font-medium">{service.owner}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
