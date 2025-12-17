import Link from "next/link";
import { getAllServices } from "@/lib/db/services";
import { getAllIncidents } from "@/lib/db/incidents";
import { getRecentHealthChecks } from "@/lib/db/healthchecks";

async function getStatus() {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/status`,
      {
        cache: "no-store",
      }
    );
    return await res.json();
  } catch (error) {
    return { database: "error", error: String(error) };
  }
}

export default async function HomePage() {
  const status = await getStatus();
  const services = await getAllServices();
  const incidents = await getAllIncidents(20);
  const healthChecks = await getRecentHealthChecks(10);

  const openIncidents = incidents.filter((i) => i.status === "OPEN");
  const upServices = services.filter((s) => s.lastStatus === "UP");

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2 text-gray-900 dark:text-white">
            ZStatus
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Service Monitoring Platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Services
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {services.length}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {upServices.length} healthy
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Open Incidents
              </h3>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {openIncidents.length}
            </p>
            <Link
              href="/incidents"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
            >
              View all incidents →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Database
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.database === "connected"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {status.database}
            </span>
            {status.error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {status.error}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Scheduler
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {status.scheduler || "running"}
            </span>
            {status.lastHeartbeat && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last: {new Date(status.lastHeartbeat).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Link
            href="/overview"
            className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Service Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View health status of all configured services
            </p>
          </Link>

          <Link
            href="/incidents"
            className="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Incident History
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Review past and active incidents with filtering
            </p>
          </Link>
        </div>

        {/* Recent Activity */}
        {healthChecks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Health Checks
            </h3>
            <div className="space-y-2">
              {healthChecks.slice(0, 5).map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        check.status === "UP"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {check.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {check.serviceName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{check.responseTime}ms</span>
                    <span>
                      {new Date(check.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
