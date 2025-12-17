import { ObjectId } from "mongodb";

// Health check status
export type HealthCheckStatus = "UP" | "DOWN";

// Health check result interface
export interface HealthCheck {
  _id: ObjectId;
  id: string; // UUID
  serviceId: string; // Reference to service
  serviceName: string; // Denormalized for easy querying
  status: HealthCheckStatus;
  responseTime: number; // in milliseconds
  statusCode?: number; // HTTP status code (if applicable)
  errorMessage?: string; // Error details if check failed
  timestamp: Date;
}

// DTO for health check response
export interface HealthCheckResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  status: HealthCheckStatus;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  timestamp: string;
}

// Health check result from runner
export interface HealthCheckResult {
  status: HealthCheckStatus;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
}
