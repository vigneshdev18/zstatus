import Link from "next/link";
import { getAllGroups } from "@/lib/db/groups";
import { getAllServices } from "@/lib/db/services";
import {
  HiServer,
  HiBell,
  HiFolder,
  HiInformationCircle,
} from "react-icons/hi";

export default async function GroupsPage() {
  const groups = await getAllGroups();
  const services = await getAllServices();

  // Count services per group
  const groupServiceCounts = groups.map((group) => ({
    ...group,
    serviceCount: services.filter((s) => s.groupId === group.id).length,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Service Groups
          </h1>
          <p className="text-gray-400">
            Organize services and configure notification channels by team
          </p>
        </div>
        <Link
          href="/groups/new"
          className="px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
        >
          + Create Group
        </Link>
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
          <Link
            href="/groups/new"
            className="inline-block px-6 py-3 bg-gradient-primary rounded-xl text-white font-medium hover:scale-105 transition-smooth shadow-gradient"
          >
            Create First Group
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupServiceCounts.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}/edit`}
              className="glass rounded-2xl p-6 hover:scale-105 transition-smooth cursor-pointer group"
            >
              {/* Group Color Bar */}
              <div
                className="h-2 rounded-full mb-4"
                style={{
                  background: group.color || "#667eea",
                }}
              />

              {/* Group Info */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:gradient-text transition-smooth">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <HiServer className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">
                    {group.serviceCount}{" "}
                    {group.serviceCount === 1 ? "service" : "services"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HiBell className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">
                    {group.webhookUrls.length}{" "}
                    {group.webhookUrls.length === 1 ? "channel" : "channels"}
                  </span>
                </div>
              </div>

              {/* Webhook Status */}
              {group.webhookUrls.length === 0 && (
                <div className="mt-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                  <HiInformationCircle className="w-4 h-4 text-yellow-300" />
                  <p className="text-xs text-yellow-300">
                    No webhooks configured
                  </p>
                </div>
              )}
            </Link>
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
