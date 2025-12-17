import { ObjectId } from "mongodb";

// Incident status
export type IncidentStatus = "OPEN" | "CLOSED";

// Incident interface
export interface Incident {
  _id: ObjectId;
  id: string; // UUID
  serviceId: string; // Reference to service
  serviceName: string; // Denormalized for easy querying
  status: IncidentStatus;
  startTime: Date; // When the incident started
  endTime?: Date; // When the incident was resolved
  duration?: number; // Duration in milliseconds (calculated when closed)
  failedChecks: number; // Number of consecutive failed checks
  // Correlation fields
  isCorrelated?: boolean; // Whether this incident is part of a correlated group
  correlationId?: string; // Group ID for correlated incidents
  rootCauseServiceId?: string; // ID of the root cause service (if correlated)
  impactedServiceIds?: string[]; // IDs of services impacted by this root cause
  createdAt: Date;
  updatedAt: Date;
}

// DTO for incident response
export interface IncidentResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  status: IncidentStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  failedChecks: number;
  createdAt: string;
  updatedAt: string;
}
