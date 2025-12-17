import Link from "next/link";
import { getServiceById } from "@/lib/db/services";
import { getAllIncidents } from "@/lib/db/incidents";
import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/utils/format";

export default async function ServiceIncidentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const allIncidents = await getAllIncidents();
  const incidents = allIncidents.filter((i) => i.serviceId === id);
  const openIncidents = incidents.filter((i) => i.status === "OPEN");
  const closedIncidents = incidents.filter((i) => i.status === "CLOSED");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/services/${id}`}
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Service
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Incidents for {service.name}
        </h1>
        <p className="text-gray-400">Historical incident data and analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Incidents</p>
          <p className="text-2xl font-bold text-white">{incidents.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Currently Open</p>
          <p className="text-2xl font-bold text-red-400">
            {openIncidents.length}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-400">
            {closedIncidents.length}
          </p>
        </div>
      </div>

      {/* Open Incidents */}
      {openIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Open Incidents</h2>
          <div className="space-y-3">
            {openIncidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="block glass rounded-xl p-6 hover:bg-white/10 transition-smooth border-l-4 border-red-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                        OPEN
                      </span>
                      {incident.isCorrelated && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                          {incident.rootCauseServiceId === incident.serviceId
                            ? "ROOT CAUSE"
                            : "IMPACTED"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-1">
                      Started {new Date(incident.startTime).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {incident.failedChecks} failed{" "}
                      {incident.failedChecks === 1 ? "check" : "checks"}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Closed Incidents */}
      {closedIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Resolved Incidents
          </h2>
          <div className="space-y-3">
            {closedIncidents.map((incident) => {
              const duration = incident.duration
                ? Math.round(incident.duration / 1000)
                : 0;

              return (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="block glass rounded-xl p-6 hover:bg-white/10 transition-smooth border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                          RESOLVED
                        </span>
                        {incident.isCorrelated && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                            {incident.rootCauseServiceId === incident.serviceId
                              ? "ROOT CAUSE"
                              : "IMPACTED"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>
                          Started{" "}
                          {new Date(incident.startTime).toLocaleString()}
                        </span>
                        {duration > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              Duration: {formatDuration(incident.duration || 0)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {incidents.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Incidents</h3>
          <p className="text-gray-400">
            This service has never experienced any downtime
          </p>
        </div>
      )}
    </div>
  );
}
