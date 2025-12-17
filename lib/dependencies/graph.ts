import { getAllServices, getServiceById } from "@/lib/db/services";
import { Service } from "@/lib/types/service";

// Build a dependency map: serviceId -> array of services that depend on it
export function buildDependencyGraph(
  services: Service[]
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  // Initialize graph with all services
  services.forEach((service) => {
    if (!graph.has(service.id)) {
      graph.set(service.id, []);
    }
  });

  // Build reverse dependency map (who depends on this service)
  services.forEach((service) => {
    if (service.dependencies) {
      service.dependencies.forEach((depId) => {
        const dependents = graph.get(depId) || [];
        dependents.push(service.id);
        graph.set(depId, dependents);
      });
    }
  });

  return graph;
}

// Get all services that depend on a given service (directly or indirectly)
export function getDownstreamServices(
  serviceId: string,
  dependencyGraph: Map<string, string[]>,
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(serviceId)) {
    return [];
  }

  visited.add(serviceId);
  const directDependents = dependencyGraph.get(serviceId) || [];
  const allDependents: string[] = [...directDependents];

  // Recursively get dependents of dependents
  directDependents.forEach((depId) => {
    const transitive = getDownstreamServices(depId, dependencyGraph, visited);
    allDependents.push(...transitive);
  });

  return [...new Set(allDependents)]; // Remove duplicates
}

// Check if there's a circular dependency
export function hasCircularDependency(
  serviceId: string,
  dependencies: string[],
  allServices: Service[]
): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(currentId: string): boolean {
    if (recursionStack.has(currentId)) {
      return true; // Cycle detected
    }

    if (visited.has(currentId)) {
      return false;
    }

    visited.add(currentId);
    recursionStack.add(currentId);

    const service = allServices.find((s) => s.id === currentId);
    const deps =
      currentId === serviceId ? dependencies : service?.dependencies || [];

    for (const depId of deps) {
      if (detectCycle(depId)) {
        return true;
      }
    }

    recursionStack.delete(currentId);
    return false;
  }

  return detectCycle(serviceId);
}

// Validate dependencies before saving
export async function validateDependencies(
  serviceId: string,
  dependencies: string[]
): Promise<{ valid: boolean; error?: string }> {
  // Check if all dependency IDs exist
  for (const depId of dependencies) {
    const service = await getServiceById(depId);
    if (!service) {
      return {
        valid: false,
        error: `Service with ID ${depId} does not exist`,
      };
    }
  }

  // Check for circular dependencies
  const allServices = await getAllServices();
  if (hasCircularDependency(serviceId, dependencies, allServices)) {
    return {
      valid: false,
      error: "Circular dependency detected",
    };
  }

  return { valid: true };
}
