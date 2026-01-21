import Link from "next/link";
import { getAllServices } from "@/lib/db/services";
import { getAllIncidents } from "@/lib/db/incidents";
import { Grid, GridItem } from "@/app/components/Grid";
import RefreshServiceButton from "@/app/components/RefreshServiceButton";
import { HiServer, HiCheckCircle, HiExclamation } from "react-icons/hi";
import PageHeader from "../components/PageHeader";
import ViewAllButton from "../components/Button/ViewAllButton";
import DetailCard from "../components/DetailsCard";

export default async function OverviewPage() {
  const services = await getAllServices();
  const incidents = await getAllIncidents();

  const activeIncidents = incidents.filter((i) => i.status === "OPEN");
  const healthyServices = services.filter((s) => s.lastStatus === "UP").length;
  const downServices = services.filter((s) => s.lastStatus === "DOWN").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Overview"
        subtitle="Monitor your services at a glance"
        showBack={false}
      />

      <Grid cols={3} gap={6}>
        <GridItem>
          <DetailCard
            title="Total Services"
            value={services.length}
            icon={<HiServer className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-primary"
          />
        </GridItem>
        <GridItem>
          <DetailCard
            title="Healthy Services"
            value={healthyServices}
            icon={<HiCheckCircle className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-success"
          />
        </GridItem>
        <GridItem>
          <DetailCard
            title="Down Services"
            value={downServices}
            icon={<HiExclamation className="w-8 h-8 text-white" />}
            iconContainerClass="bg-gradient-danger"
          />
        </GridItem>
      </Grid>

      {/* Services & Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services List */}

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Services</h2>
            <ViewAllButton href="/services" />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {services.map((service) => (
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
                          : service.lastStatus === "DOWN"
                          ? "bg-red-500"
                          : "bg-yellow-500"
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
                        : service.lastStatus === "DOWN"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-yellow-500/20 text-yellow-300"
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
            <ViewAllButton href="/incidents" />
          </div>

          {activeIncidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <HiCheckCircle className="w-8 h-8 text-green-400" />
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
