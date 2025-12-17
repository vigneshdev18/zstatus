"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiGlobeAlt, HiDatabase, HiSearch } from "react-icons/hi";
import Select, { SelectOption } from "@/app/components/Select";

type ServiceType = "api" | "mongodb" | "elasticsearch";

interface Group {
  id: string;
  name: string;
  color?: string;
}

const httpMethodOptions: SelectOption[] = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "HEAD", label: "HEAD" },
  { value: "PATCH", label: "PATCH" },
];

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("api");
  const [groups, setGroups] = useState<Group[]>([]);
  const [httpMethod, setHttpMethod] = useState<SelectOption>(
    httpMethodOptions[0]
  );
  const [selectedGroup, setSelectedGroup] = useState<SelectOption | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const data: any = {
      name: formData.get("name"),
      serviceType,
      timeout: parseInt(formData.get("timeout") as string) || 5000,
      checkInterval: parseInt(formData.get("interval") as string) || 60,
      groupId: selectedGroup?.value || undefined,
      alertsEnabled,
      description: formData.get("description") || undefined,
      team: formData.get("team") || undefined,
      owner: formData.get("owner") || undefined,
      grafanaDashboardId: formData.get("grafanaDashboardId") || undefined,
    };

    // Add type-specific fields
    if (serviceType === "api") {
      data.healthCheckUrl = formData.get("healthCheckUrl");
      data.httpMethod = httpMethod.value;
      const headers = formData.get("requestHeaders");
      if (headers) {
        try {
          data.requestHeaders = JSON.parse(headers as string);
        } catch {
          setError("Invalid JSON in request headers");
          setLoading(false);
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
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create service");
      }

      router.push("/services");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/services"
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Add New Service
        </h1>
        <p className="text-gray-400">Configure a new service for monitoring</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Service Type Selector */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Service Type</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                type: "api" as const,
                label: "API / HTTP",
                Icon: HiGlobeAlt,
                color: "text-blue-400",
              },
              {
                type: "mongodb" as const,
                label: "MongoDB",
                Icon: HiDatabase,
                color: "text-green-400",
              },
              {
                type: "elasticsearch" as const,
                label: "Elasticsearch",
                Icon: HiSearch,
                color: "text-yellow-400",
              },
            ].map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setServiceType(option.type)}
                className={`
                  p-4 rounded-xl border-2 transition-smooth text-center
                  ${
                    serviceType === option.type
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }
                `}
              >
                <option.Icon
                  className={`w-8 h-8 mx-auto mb-2 ${option.color}`}
                />
                <div className="text-sm font-medium text-white">
                  {option.label}
                </div>
              </button>
            ))}
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  placeholder="e.g., API Gateway"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                      placeholder="https://api.example.com/health"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="httpMethod"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      HTTP Method
                    </label>
                    <Select
                      value={httpMethod}
                      onChange={(option) =>
                        setHttpMethod(option as SelectOption)
                      }
                      options={httpMethodOptions}
                      isSearchable={false}
                    />
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                      placeholder="Optional request body for POST/PUT"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                      placeholder="mongodb://localhost:27017"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                      placeholder="admin"
                      defaultValue="admin"
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth font-mono text-sm"
                    placeholder="http://localhost:9200"
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
                    defaultValue="5000"
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
                    defaultValue="60"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  placeholder="Optional description of this service"
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
                <Select
                  value={selectedGroup}
                  onChange={(option) =>
                    setSelectedGroup(option as SelectOption | null)
                  }
                  options={[
                    { value: "", label: "No Group (No Notifications)" },
                    ...groups.map((g) => ({ value: g.id, label: g.name })),
                  ]}
                  isClearable
                  placeholder="Select a group..."
                />
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  placeholder="e.g., Platform Team"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  placeholder="owner@example.com"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/services"
            className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-smooth"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Service"}
          </button>
        </div>
      </form>
    </div>
  );
}
