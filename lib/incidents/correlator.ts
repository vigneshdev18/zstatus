import { getAllServices } from "@/lib/db/services";
import { getActiveIncident } from "@/lib/db/incidents";
import {
  buildDependencyGraph,
  getDownstreamServices,
} from "@/lib/dependencies/graph";
import { updateIncidentCorrelation } from "@/lib/db/incident-correlation";

const CORRELATION_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

// Correlate incidents that occur within a time window
export async function correlateIncidents(
  serviceId: string,
  incidentStartTime: Date
): Promise<void> {
  try {
    const services = await getAllServices();
    const dependencyGraph = buildDependencyGraph(services);

    // Find the service that failed
    const failedService = services.find((s) => s.id === serviceId);
    if (!failedService) return;

    // Get the incident for this service
    const currentIncident = await getActiveIncident(serviceId);
    if (!currentIncident) return;

    // Check if this service depends on any other service
    const dependencies = failedService.dependencies || [];

    if (dependencies.length === 0) {
      // This is an independent service or potential root cause
      // Check if any downstream services also have incidents
      const downstreamServiceIds = getDownstreamServices(
        serviceId,
        dependencyGraph
      );

      if (downstreamServiceIds.length > 0) {
        // Check for incidents in downstream services within the time window
        const correlatedIncidents: string[] = [];

        for (const downstreamId of downstreamServiceIds) {
          const downstreamIncident = await getActiveIncident(downstreamId);

          if (downstreamIncident) {
            const timeDiff = Math.abs(
              downstreamIncident.startTime.getTime() -
                incidentStartTime.getTime()
            );

            if (timeDiff <= CORRELATION_WINDOW_MS) {
              correlatedIncidents.push(downstreamId);

              // Mark downstream incident as correlated
              await updateIncidentCorrelation(
                downstreamIncident.id,
                currentIncident.id,
                serviceId,
                []
              );
            }
          }
        }

        // Mark this incident as root cause if there are correlated downstream incidents
        if (correlatedIncidents.length > 0) {
          await updateIncidentCorrelation(
            currentIncident.id,
            currentIncident.id,
            serviceId,
            correlatedIncidents
          );

          console.log(
            `[Correlation] Root cause: ${failedService.name}, Impacted: ${correlatedIncidents.length} service(s)`
          );
        }
      }
    } else {
      // This service depends on others - check if dependencies have incidents
      for (const depId of dependencies) {
        const depIncident = await getActiveIncident(depId);

        if (depIncident) {
          const timeDiff = Math.abs(
            depIncident.startTime.getTime() - incidentStartTime.getTime()
          );

          if (timeDiff <= CORRELATION_WINDOW_MS) {
            // This incident is likely caused by the dependency failure
            await updateIncidentCorrelation(
              currentIncident.id,
              depIncident.id,
              depId,
              []
            );

            console.log(
              `[Correlation] ${failedService.name} impacted by root cause: ${
                services.find((s) => s.id === depId)?.name
              }`
            );

            // Update the root cause incident to include this service as impacted
            const rootImpactedIds = depIncident.impactedServiceIds || [];
            if (!rootImpactedIds.includes(serviceId)) {
              rootImpactedIds.push(serviceId);
              await updateIncidentCorrelation(
                depIncident.id,
                depIncident.id,
                depId,
                rootImpactedIds
              );
            }

            break; // Stop after finding first correlated dependency
          }
        }
      }
    }
  } catch (error) {
    console.error("[Correlation] Error correlating incidents:", error);
  }
}
