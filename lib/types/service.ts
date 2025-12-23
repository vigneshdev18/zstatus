import { ObjectId } from "mongodb";

// Service type definition
export type ServiceType = "api" | "mongodb" | "elasticsearch" | "redis";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "PATCH";

// Redis operation definition
export interface RedisOperation {
  command: string; // e.g., "GET", "HGET", "SMEMBERS"
  args: string[]; // e.g., ["mykey"] or ["myhash", "field"]
}

// MongoDB pipeline definition
export interface MongoDBPipeline {
  collection: string; // Collection to query
  pipeline: any[]; // Aggregation pipeline stages
}

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
  mongoPipelines?: MongoDBPipeline[]; // Array of pipelines to execute

  // Elasticsearch specific fields
  esConnectionString?: string; // Elasticsearch URL

  // Redis specific fields
  redisConnectionString?: string; // Redis connection URL (redis://host:port)
  redisPassword?: string; // Optional password for authentication
  redisDatabase?: number; // Optional database number (default: 0)
  redisOperations?: RedisOperation[]; // Array of operations to execute

  // Optional metadata
  groupId?: string; // Optional group assignment (if not set, no notifications sent)
  alertsEnabled?: boolean; // Whether to send alerts for this service (defaults to true)
  dependencies?: string[]; // Array of service IDs that this service depends on
  grafanaDashboardId?: string; // Optional Grafana dashboard ID for this service
  team?: string; // Team or department that owns this service
  owner?: string; // Primary contact or owner email/name
  description?: string; // Optional service description

  // Response time alerting
  responseTimeWarningMs?: number; // Warning threshold in milliseconds (default: 3000)
  responseTimeWarningAttempts?: number; // Consecutive attempts before warning alert (default: 3)
  responseTimeCriticalMs?: number; // Critical threshold in milliseconds (default: 5000)
  responseTimeCriticalAttempts?: number; // Consecutive attempts before critical alert (default: 3)
  consecutiveSlowWarning?: number; // Current count of consecutive warning threshold breaches
  consecutiveSlowCritical?: number; // Current count of consecutive critical threshold breaches

  // Last alert tracking
  lastAlertType?: string; // Type of last alert sent (e.g., "INCIDENT_OPENED", "RESPONSE_TIME")
  lastAlertSentAt?: Date; // Timestamp of last alert sent

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete timestamp
}

// DTO for creating a service (user input)
export interface CreateServiceInput {
  name: string;
  serviceType: ServiceType;
  timeout?: number;
  checkInterval?: number;

  // API fields
  healthCheckUrl?: string;
  httpMethod?: HttpMethod;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // MongoDB fields
  mongoConnectionString?: string;
  mongoDatabase?: string;
  mongoPipelines?: MongoDBPipeline[];

  // Elasticsearch fields
  esConnectionString?: string;

  // Redis fields
  redisConnectionString?: string;
  redisPassword?: string;
  redisDatabase?: number;
  redisOperations?: RedisOperation[];

  // Metadata
  groupId?: string;
  alertsEnabled?: boolean;
  dependencies?: string[];
  grafanaDashboardId?: string;
  team?: string;
  owner?: string;
  description?: string;

  // Response time alerting
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
}

// DTO for updating a service
export interface UpdateServiceInput {
  name?: string;
  timeout?: number;
  checkInterval?: number;

  // API fields
  healthCheckUrl?: string;
  httpMethod?: HttpMethod;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // MongoDB fields
  mongoConnectionString?: string;
  mongoDatabase?: string;
  mongoPipelines?: MongoDBPipeline[];

  // Elasticsearch fields
  esConnectionString?: string;

  // Redis fields
  redisConnectionString?: string;
  redisPassword?: string;
  redisDatabase?: number;
  redisOperations?: RedisOperation[];

  // Metadata
  groupId?: string | null; // Allow null to remove group assignment
  alertsEnabled?: boolean;
  dependencies?: string[];
  grafanaDashboardId?: string;
  team?: string;
  owner?: string;
  description?: string;

  // Response time alerting
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;
}
