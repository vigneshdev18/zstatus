import Link from "next/link";
import { getAllServices } from "@/lib/db/services";
import { getAllIncidents } from "@/lib/db/incidents";
import RefreshServiceButton from "@/app/components/RefreshServiceButton";

export default async function OverviewPage() {
  const services = await getAllServices();
  const incidents = await getAllIncidents();

  const activeIncidents = incidents.filter((i) => i.status === "OPEN");
  const healthyServices = services.filter((s) => s.lastStatus === "UP").length;
  const downServices = services.filter((s) => s.lastStatus === "DOWN").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Overview</h1>
        <p className="text-gray-400">Monitor your services at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Services */}
        <div className="glass rounded-2xl p-6 transition-smooth hover:scale-105 hover:shadow-gradient">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Services</p>
              <p className="text-4xl font-bold text-white">{services.length}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Healthy Services */}
        <div className="glass rounded-2xl p-6 transition-smooth hover:scale-105 hover:shadow-gradient">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Healthy</p>
              <p className="text-4xl font-bold text-white">{healthyServices}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-success rounded-xl flex items-center justify-center relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-xl status-pulse"></div>
              <svg
                className="w-8 h-8 text-white"
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
          </div>
        </div>

        {/* Down Services */}
        <div className="glass rounded-2xl p-6 transition-smooth hover:scale-105 hover:shadow-gradient">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Down</p>
              <p className="text-4xl font-bold text-white">{downServices}</p>
            </div>
            <div className="w-16 h-16 bg-gradient-danger rounded-xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Services & Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services List */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Services</h2>
            <Link
              href="/services"
              className="text-sm text-purple-400 hover:text-purple-300 transition-smooth"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {services.slice(0, 5).map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-smooth border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`
                      w-2 h-2 rounded-full
                      ${
                        service.lastStatus === "UP"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }
                    `}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{service.name}</p>
                      <p className="text-xs text-gray-400">
                        {service.healthCheckUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      service.lastStatus === "UP"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }
                  `}
                    >
                      {service.lastStatus || "PENDING"}
                    </span>
                    <RefreshServiceButton serviceId={service.id} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Active Incidents</h2>
            <Link
              href="/incidents"
              className="text-sm text-purple-400 hover:text-purple-300 transition-smooth"
            >
              View all →
            </Link>
          </div>

          {activeIncidents.length === 0 ? (
            <div className="text-center py-12">
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
              <p className="text-gray-400">No active incidents</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIncidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="block p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-smooth border border-red-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {incident.serviceName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Started {new Date(incident.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                      OPEN
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
