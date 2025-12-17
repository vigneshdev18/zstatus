import { ObjectId } from "mongodb";

// Service type definition
export type ServiceType = "api" | "mongodb" | "elasticsearch";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "PATCH";

// Service interface - what gets stored in MongoDB
export interface Service {
  _id: ObjectId;
  id: string; // UUID for public reference
  name: string;
  serviceType: ServiceType; // Type of health check

  // Common fields
  timeout: number; // in milliseconds
  checkInterval: number; // in seconds
  lastStatus?: "UP" | "DOWN"; // Track last known status for incident detection
  lastCheckedAt?: Date; // Last health check timestamp

  // API/HTTP specific fields
  healthCheckUrl?: string; // For API type
  httpMethod?: HttpMethod; // HTTP method for API checks
  requestHeaders?: Record<string, string>; // Custom headers
  requestBody?: string; // Request body for POST/PUT

  // MongoDB specific fields
  mongoConnectionString?: string; // MongoDB connection string
  mongoDatabase?: string; // Database to test

  // Elasticsearch specific fields
  esConnectionString?: string; // Elasticsearch URL

  // Optional metadata
  groupId?: string; // Optional group assignment (if not set, no notifications sent)
  alertsEnabled?: boolean; // Whether to send alerts for this service (defaults to true)
  dependencies?: string[]; // Array of service IDs that this service depends on
  grafanaDashboardId?: string; // Optional Grafana dashboard ID for this service
  team?: string; // Team or department that owns this service
  owner?: string; // Primary contact or owner email/name
  description?: string; // Optional service description

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}

// DTO for creating a service (user input)
export interface CreateServiceInput {
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;

  // API fields
  healthCheckUrl?: string;
  httpMethod?: HttpMethod;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // MongoDB fields
  mongoConnectionString?: string;
  mongoDatabase?: string;

  // Elasticsearch fields
  esConnectionString?: string;

  // Optional metadata
  groupId?: string; // Optional group assignment
  alertsEnabled?: boolean; // Whether to send alerts
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;
}

// DTO for updating a service
export interface UpdateServiceInput {
  name?: string;
  serviceType?: ServiceType;
  timeout?: number;
  checkInterval?: number;
  lastStatus?: "UP" | "DOWN";
  lastCheckTime?: Date;

  // Protocol-specific fields
  healthCheckUrl?: string;
  httpMethod?: HttpMethod;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  mongoConnectionString?: string;
  mongoDatabase?: string;
  esConnectionString?: string;

  // Metadata
  groupId?: string; // Optional group assignment
  alertsEnabled?: boolean; // Whether to send alerts
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;
  deletedAt?: Date; // For soft delete/restore operations
}

// DTO for service response (what API returns)
export interface ServiceResponse {
  id: string;
  name: string;
  serviceType: ServiceType;
  timeout: number;
  checkInterval: number;
  createdAt: string;
  updatedAt: string;
}
