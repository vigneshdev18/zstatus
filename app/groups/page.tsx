"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { HiBell, HiFolder, HiInformationCircle } from "react-icons/hi";
import PageHeader from "../components/PageHeader";
import GroupCard from "../components/GroupCard";
import { useAuth } from "@/lib/contexts/AuthContext";
import Unauthorized from "@/app/components/Unauthorized";
import Loading from "@/app/components/Loading";

export default function GroupsPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Use client-side data fetching
  const { data: groupsData, isLoading: groupsLoading } =
    useApiQuery("/api/groups");
  const { data: servicesData, isLoading: servicesLoading } =
    useApiQuery("/api/services");

  const groups = groupsData?.groups || [];
  const services = servicesData?.services || [];

  // Count services per group
  const groupServiceCounts = groups.map((group) => ({
    ...group,
    serviceCount: services.filter((s) => s.groupId === group.id).length,
  }));

  if (authLoading || groupsLoading || servicesLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Service Groups"
          subtitle="Organize services and configure notification channels by team"
        />

        {user?.role !== "viewer" && (
          <Link
            href="/groups/new"
            className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
          >
            + Create Group
          </Link>
        )}
      </div>

      {/* Groups Grid */}
      {groupServiceCounts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <HiFolder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-white mb-2">No Groups Yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first group to organize services and configure
            notifications
          </p>
          {user?.role !== "viewer" && (
            <Link
              href="/groups/new"
              className="inline-block px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
            >
              Create First Group
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupServiceCounts.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">About Groups</h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <HiFolder className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <strong className="text-white">Organize Services:</strong> Group
              services by team, environment, or any criteria
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HiBell className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <strong className="text-white">
                Multi-Channel Notifications:
              </strong>{" "}
              Add multiple Teams webhook URLs per group
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HiInformationCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <strong className="text-white">Optional Assignment:</strong>{" "}
              Services without a group won't send notifications
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
