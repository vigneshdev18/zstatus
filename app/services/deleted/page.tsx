"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiGlobeAlt, HiDatabase, HiSearch, HiRefresh } from "react-icons/hi";
import Loading from "@/app/components/Loading";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

type ServiceType = "api" | "mongodb" | "elasticsearch";

interface DeletedService {
  id: string;
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;
  groupId?: string;
  description?: string;
  team?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export default function DeletedServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Fetch deleted services using useApiQuery
  const { data: deletedServicesData, isLoading } = useApiQuery<{
    services: DeletedService[];
  }>("/api/services/deleted");

  const services = deletedServicesData?.services || [];

  const handleRestore = async (id: string) => {
    setError("");
    setRestoringId(id);

    try {
      const response = await fetch(`/api/services/${id}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        // Invalidate both deleted services and active services caches
        await queryClient.invalidateQueries({
          queryKey: ["api", "/api/services/deleted"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["api", "/api/services"],
        });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to restore service");
      }
    } catch (err) {
      setError("An error occurred while restoring the service");
    } finally {
      setRestoringId(null);
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case "api":
        return <HiGlobeAlt className="w-6 h-6 text-blue-400" />;
      case "mongodb":
        return <HiDatabase className="w-6 h-6 text-green-400" />;
      case "elasticsearch":
        return <HiSearch className="w-6 h-6 text-yellow-400" />;
    }
  };

  if (isLoading) {
    return <Loading message="Loading deleted services..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/services"
          className="text-gray-400 hover:text-white transition-smooth inline-block mb-4"
        >
          ← Back to Services
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Deleted Services
        </h1>
        <p className="text-gray-400">
          Restore previously deleted services or permanently remove them
        </p>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/10">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-gray-400 mb-4">No deleted services found</p>
          <Link
            href="/services"
            className="text-purple-400 hover:text-purple-300"
          >
            View active services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="glass rounded-2xl p-6 hover:scale-105 transition-smooth border border-white/10"
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getServiceIcon(service.serviceType)}
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {service.serviceType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-2 mb-4">
                {service.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {service.description}
                  </p>
                )}
                {service.team && (
                  <p className="text-xs text-gray-500">Team: {service.team}</p>
                )}
                {service.owner && (
                  <p className="text-xs text-gray-500">
                    Owner: {service.owner}
                  </p>
                )}
              </div>

              {/* Deletion Info */}
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">
                  Deleted:{" "}
                  {service.deletedAt
                    ? new Date(service.deletedAt).toLocaleString()
                    : "Unknown"}
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleRestore(service.id)}
                disabled={restoringId === service.id}
                className="w-full px-4 py-2 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <HiRefresh
                  className={`w-4 h-4 ${
                    restoringId === service.id ? "animate-spin" : ""
                  }`}
                />
                {restoringId === service.id
                  ? "Restoring..."
                  : "Restore Service"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
