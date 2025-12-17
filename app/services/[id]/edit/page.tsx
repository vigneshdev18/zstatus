"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiGlobeAlt, HiDatabase, HiSearch } from "react-icons/hi";
import Loading from "@/app/components/Loading";

type ServiceType = "api" | "mongodb" | "elasticsearch";

interface Group {
  id: string;
  name: string;
  color?: string;
}

interface Service {
  id: string;
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;

  // API fields
  healthCheckUrl?: string;
  httpMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // MongoDB fields
  mongoConnectionString?: string;
  mongoDatabase?: string;

  // Elasticsearch fields
  esConnectionString?: string;

  // Metadata
  groupId?: string;
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;
}

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("api");
  const [groups, setGroups] = useState<Group[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchService(p.id);
    });
    fetchGroups();
  }, [params]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) {
        throw new Error("Service not found");
      }
      const data = await response.json();
      setService(data.service);
      setServiceType(data.service.serviceType);
      // Set alerts enabled (default to true if not set)
      setAlertsEnabled(
        data.service.alertsEnabled !== undefined
          ? data.service.alertsEnabled
          : true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const data: any = {
      name: formData.get("name"),
      serviceType,
      timeout: parseInt(formData.get("timeout") as string) || null,
      checkInterval: parseInt(formData.get("interval") as string) || null,
      groupId: formData.get("groupId") || null,
      alertsEnabled,
      description: formData.get("description") || null,
      team: formData.get("team") || null,
      owner: formData.get("owner") || null,
      grafanaDashboardId: formData.get("grafanaDashboardId") || null,
    };

    // Add type-specific fields
    if (serviceType === "api") {
      data.healthCheckUrl = formData.get("healthCheckUrl");
      data.httpMethod = formData.get("httpMethod") || "GET";
      const headers = formData.get("requestHeaders");
      if (headers) {
        try {
          data.requestHeaders = JSON.parse(headers as string);
        } catch {
          setError("Invalid JSON in request headers");
          setSaving(false);
          return;
        }
      }
      data.requestBody = formData.get("requestBody") || undefined;
    } else if (serviceType === "mongodb") {
      data.mongoConnectionString = formData.get("mongoConnectionString");
      data.mongoDatabase = formData.get("mongoDatabase") || "admin";
    } else if (serviceType === "elasticsearch") {
      data.esConnectionString = formData.get("esConnectionString");
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update service");
      }

      router.push(`/services/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Loading service..." />;
  }

  if (!service) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Service not found</p>
          <Link
            href="/services"
            className="text-purple-400 hover:text-purple-300"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/services/${id}`}
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Service
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">Edit Service</h1>
        <p className="text-gray-400">Update service configuration</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Service Type Display (read-only) */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Service Type</h3>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg flex items-center gap-2">
              {serviceType === "api" && (
                <>
                  <HiGlobeAlt className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">API / HTTP</span>
                </>
              )}
              {serviceType === "mongodb" && (
                <>
                  <HiDatabase className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">MongoDB</span>
                </>
              )}
              {serviceType === "elasticsearch" && (
                <>
                  <HiSearch className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Elasticsearch</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Service type cannot be changed after creation
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white">
                Service Configuration
              </h3>

              {/* Service Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Service Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={service.name}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                />
              </div>

              {/* API-specific fields */}
              {serviceType === "api" && (
                <>
                  <div>
                    <label
                      htmlFor="healthCheckUrl"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Health Check URL *
                    </label>
                    <input
                      type="url"
                      id="healthCheckUrl"
                      name="healthCheckUrl"
                      required
                      defaultValue={service.healthCheckUrl}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="httpMethod"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      HTTP Method
                    </label>
                    <select
                      id="httpMethod"
                      name="httpMethod"
                      defaultValue={service.httpMethod || "GET"}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="requestHeaders"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Request Headers (JSON)
                    </label>
                    <textarea
                      id="requestHeaders"
                      name="requestHeaders"
                      rows={3}
                      defaultValue={
                        service.requestHeaders
                          ? JSON.stringify(service.requestHeaders, null, 2)
                          : ""
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                      placeholder='{"Authorization": "Bearer token"}'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="requestBody"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Request Body
                    </label>
                    <textarea
                      id="requestBody"
                      name="requestBody"
                      rows={3}
                      defaultValue={service.requestBody}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                    />
                  </div>
                </>
              )}

              {/* MongoDB-specific fields */}
              {serviceType === "mongodb" && (
                <>
                  <div>
                    <label
                      htmlFor="mongoConnectionString"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Connection String *
                    </label>
                    <input
                      type="text"
                      id="mongoConnectionString"
                      name="mongoConnectionString"
                      required
                      defaultValue={service.mongoConnectionString}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mongoDatabase"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Database
                    </label>
                    <input
                      type="text"
                      id="mongoDatabase"
                      name="mongoDatabase"
                      defaultValue={service.mongoDatabase || "admin"}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                    />
                  </div>
                </>
              )}

              {/* Elasticsearch-specific fields */}
              {serviceType === "elasticsearch" && (
                <div>
                  <label
                    htmlFor="esConnectionString"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Connection URL *
                  </label>
                  <input
                    type="url"
                    id="esConnectionString"
                    name="esConnectionString"
                    required
                    defaultValue={service.esConnectionString}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                  />
                </div>
              )}

              {/* Common fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="timeout"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    id="timeout"
                    name="timeout"
                    defaultValue={service.timeout}
                    min="1000"
                    max="30000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interval"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Check Interval (s)
                  </label>
                  <input
                    type="number"
                    id="interval"
                    name="interval"
                    defaultValue={service.checkInterval}
                    min="30"
                    max="3600"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={service.description}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Ownership */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Ownership</h3>

              {/* Group Selector */}
              <div>
                <label
                  htmlFor="groupId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Group (Optional)
                </label>
                <select
                  id="groupId"
                  name="groupId"
                  defaultValue={service.groupId || ""}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                >
                  <option value="">No Group (No Notifications)</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  Services without a group won't send notifications
                </p>
              </div>

              {/* Alerts Enabled Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Notifications
                </label>
                <button
                  type="button"
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    alertsEnabled ? "bg-purple-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      alertsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-white">
                  {alertsEnabled ? "Enabled" : "Disabled"}
                </span>
                <p className="text-xs text-gray-400 mt-2">
                  {alertsEnabled
                    ? "Notifications will be sent when incidents occur"
                    : "Health checks continue, but no notifications will be sent"}
                </p>
              </div>

              <div>
                <label
                  htmlFor="team"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Team
                </label>
                <input
                  type="text"
                  id="team"
                  name="team"
                  defaultValue={service.team}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                />
              </div>

              <div>
                <label
                  htmlFor="owner"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Owner
                </label>
                <input
                  type="text"
                  id="owner"
                  name="owner"
                  defaultValue={service.owner}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                />
              </div>

              <div>
                <label
                  htmlFor="grafanaDashboardId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Grafana Dashboard ID
                </label>
                <input
                  type="text"
                  id="grafanaDashboardId"
                  name="grafanaDashboardId"
                  defaultValue={service.grafanaDashboardId}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/services/${id}`}
            className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
