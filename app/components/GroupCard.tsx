import { Group } from "@/lib/types/group";
import Link from "next/link";
import { HiBell, HiInformationCircle, HiServer } from "react-icons/hi";

const GroupCard = ({ group }: { group: Group & { serviceCount: number } }) => {
  return (
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
          <p className="text-xs text-yellow-300">No webhooks configured</p>
        </div>
      )}
    </Link>
  );
};

export default GroupCard;
