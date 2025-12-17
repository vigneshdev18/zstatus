import { NextResponse } from "next/server";
import { Registry, Gauge, Counter } from "prom-client";
import { getAllServices } from "@/lib/db/services";
import { getAllIncidents } from "@/lib/db/incidents";
import { getRecentHealthChecks } from "@/lib/db/healthchecks";

export async function GET() {
  // Create a new registry for this request
  const register = new Registry();

  // Define metrics
  const serviceUpGauge = new Gauge({
    name: "zstatus_service_up",
    help: "Service health status (1 = UP, 0 = DOWN)",
    labelNames: ["service_name", "service_id"],
    registers: [register],
  });

  const responseTimeGauge = new Gauge({
    name: "zstatus_response_time_ms",
    help: "Last response time in milliseconds",
    labelNames: ["service_name", "service_id"],
    registers: [register],
  });

  const incidentsCounter = new Gauge({
    name: "zstatus_total_incidents",
    help: "Total number of incidents",
    labelNames: ["service_name", "service_id", "status"],
    registers: [register],
  });

  const healthChecksCounter = new Counter({
    name: "zstatus_health_checks_total",
    help: "Total health checks performed",
    labelNames: ["service_name", "service_id", "status"],
    registers: [register],
  });

  try {
    // Fetch data
    const services = await getAllServices();
    const incidents = await getAllIncidents();
    const healthChecks = await getRecentHealthChecks(100);

    // Set service metrics
    for (const service of services) {
      const labels = {
        service_name: service.name,
        service_id: service.id,
      };

      // Service up/down status
      serviceUpGauge.set(labels, service.lastStatus === "UP" ? 1 : 0);

      // Response time (use a recent health check)
      const recentCheck = healthChecks.find(
        (hc) => hc.serviceId === service.id
      );
      if (recentCheck) {
        responseTimeGauge.set(labels, recentCheck.responseTime);
      }

      // Count incidents by status
      const openIncidents = incidents.filter(
        (inc) => inc.serviceId === service.id && inc.status === "OPEN"
      ).length;
      const closedIncidents = incidents.filter(
        (inc) => inc.serviceId === service.id && inc.status === "CLOSED"
      ).length;

      incidentsCounter.set({ ...labels, status: "OPEN" }, openIncidents);
      incidentsCounter.set({ ...labels, status: "CLOSED" }, closedIncidents);

      // Health check counters
      const serviceHealthChecks = healthChecks.filter(
        (hc) => hc.serviceId === service.id
      );
      const upChecks = serviceHealthChecks.filter(
        (hc) => hc.status === "UP"
      ).length;
      const downChecks = serviceHealthChecks.filter(
        (hc) => hc.status === "DOWN"
      ).length;

      healthChecksCounter.inc({ ...labels, status: "UP" }, upChecks);
      healthChecksCounter.inc({ ...labels, status: "DOWN" }, downChecks);
    }

    // Return metrics in Prometheus format
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  } catch (error) {
    console.error("[Metrics] Error generating metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate metrics" },
      { status: 500 }
    );
  }
}
