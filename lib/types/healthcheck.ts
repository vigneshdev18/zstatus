import { ObjectId } from "mongodb";

// Health check status
export type HealthCheckStatus = "UP" | "DOWN";

// Error type classification for better alerting and debugging
export type ErrorType =
  | "TIMEOUT"
  | "CONNECTION"
  | "AUTH"
  | "VALIDATION"
  | "UNKNOWN";

// Detailed timing metrics for performance analysis
export interface DetailedMetrics {
  dnsTime?: number; // DNS resolution time in ms
  tcpConnectionTime?: number; // TCP handshake time in ms
  tlsHandshakeTime?: number; // TLS/SSL handshake time in ms
  firstByteTime?: number; // Time to first byte in ms
  totalTime: number; // Total request time in ms
}

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
  errorType?: string; // Categorized error type
  metrics?: any; // Detailed timing metrics
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
  errorType?: string;
  metrics?: any;
  timestamp: string;
}

// Health check result from runner
export interface HealthCheckResult {
  status: HealthCheckStatus;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  errorType?: ErrorType; // Categorized error type
  metrics?: DetailedMetrics; // Detailed timing breakdown
  metadata?: {
    readResponseTime?: number; // For Redis read operations
    writeResponseTime?: number; // For Redis write operations
    keysChecked?: number; // Number of keys tested
    retryCount?: number; // Number of retries attempted
    [key: string]: any; // Allow additional metadata
  };
}
