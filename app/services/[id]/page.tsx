import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceById, deleteService } from "@/lib/db/services";
import { getHealthChecksByServiceId } from "@/lib/db/healthchecks";
import DeleteServiceButton from "@/app/components/DeleteServiceButton";
import RefreshServiceButton from "@/app/components/RefreshServiceButton";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const healthChecks = await getHealthChecksByServiceId(id, 20);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/services"
              className="text-gray-400 hover:text-white transition-smooth"
            >
              ← Back
            </Link>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            {service.name}
          </h1>
          <p className="text-gray-400">Service monitoring dashboard</p>
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Health Check URL</p>
            <p className="text-white font-mono text-sm break-all">
              {service.healthCheckUrl}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Timeout</p>
            <p className="text-white font-medium">{service.timeout}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Check Interval</p>
            <p className="text-white font-medium">{service.checkInterval}s</p>
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
                  <p className="text-white font-medium">{service.owner}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Health Check History */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Recent Health Checks
        </h2>

        {healthChecks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No health checks recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {healthChecks.map((check) => (
              <div
                key={check.id}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-smooth"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      w-3 h-3 rounded-full
                      ${check.status === "UP" ? "bg-green-500" : "bg-red-500"}
                    `}
                    ></div>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {new Date(check.timestamp).toLocaleString()}
                      </p>
                      {check.errorMessage && (
                        <p className="text-xs text-red-400 mt-1">
                          {check.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Response Time</p>
                      <p className="text-sm text-white font-medium">
                        {check.responseTime}ms
                      </p>
                    </div>
                    {check.statusCode && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Status Code</p>
                        <p className="text-sm text-white font-medium">
                          {check.statusCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-6 border border-red-500/20">
        <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 mb-4">
          Deleting this service will remove all associated health checks and
          incident history. This action cannot be undone.
        </p>
        <DeleteServiceButton serviceId={id} serviceName={service.name} />
      </div>
    </div>
  );
}
