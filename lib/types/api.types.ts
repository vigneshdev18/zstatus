// API Response Type Definitions
// This file defines the shape of all API responses for type-safe API calls

import { PaginationMetadata } from "@/lib/utils/pagination";

interface Service {
  id: string;
  name: string;
  serviceType: "api" | "mongodb" | "elasticsearch" | "redis";
  timeout: number;
  checkInterval: number;

  // API/HTTP specific
  healthCheckUrl?: string;
  httpMethod?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;

  // MongoDB specific
  mongoConnectionString?: string;
  mongoDatabase?: string;
  mongoPipelines?: Array<{ collection: string; pipeline: any[] }>;

  // Elasticsearch specific
  esConnectionString?: string;
  esIndex?: string;
  esQuery?: string;
  esUsername?: string;
  esPassword?: string;
  esApiKey?: string;

  // Redis specific
  redisConnectionString?: string;
  redisPassword?: string;
  redisDatabase?: number;
  redisOperations?: Array<{ command: string; args: string[] }>;
  redisKeys?: string[];

  // Secret state flags (true if set in DB)
  isMongoConnectionStringSet?: boolean;
  isEsConnectionStringSet?: boolean;
  isEsUsernameSet?: boolean;
  isEsPasswordSet?: boolean;
  isEsApiKeySet?: boolean;
  isRedisConnectionStringSet?: boolean;
  isRedisPasswordSet?: boolean;

  // Metadata
  groupId?: string;
  alertsEnabled: boolean;
  emailAlertsEnabled?: boolean;
  downtimeAlerts?: boolean;
  responseTimeAlerts?: boolean;
  description?: string;
  team?: string;
  owner?: string;
  grafanaDashboardId?: string;

  // Response time alerting
  responseTimeWarningMs?: number;
  responseTimeWarningAttempts?: number;
  responseTimeCriticalMs?: number;
  responseTimeCriticalAttempts?: number;

  // Retry configuration
  maxRetries?: number;
  retryDelayMs?: number;

  // Connection pooling
  connectionPoolEnabled?: boolean;
  connectionPoolSize?: number;

  // Status tracking
  lastStatus?: "UP" | "DOWN";
  lastCheckedAt?: string;
}

interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "OPEN" | "RESOLVED";
  startTime: string;
  endTime?: string;
  description?: string;
}

interface HealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "UP" | "DOWN";
  responseTime: number;
  timestamp: string;
  statusCode?: number;
  errorMessage?: string;
}

interface Alert {
  id: string;
  incidentId?: string;
  serviceId: string;
  serviceName: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  channels: string[];
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

interface Settings {
  globalHealthChecksEnabled: boolean;
  globalAlertsEnabled: boolean;
  alertCooldownMinutes: number;
  serviceEmailsEnabled?: boolean;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  webhookUrls: string[];
  alertEmails: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
  lastLoginAt: string;
}

// API Response Map
// Maps each API endpoint to its HTTP methods and response types
export type ApiResponseMap = {
  "/api/services": {
    GET: { services: Service[] };
    POST: Service;
  };
  "/api/services/[id]": {
    GET: { service: Service };
    PUT: Service;
    DELETE: { success: boolean };
  };
  "/api/services/[id]/check": {
    POST: { success: boolean };
  };
  "/api/incidents": {
    GET: { incidents: Incident[] };
    POST: Incident;
  };
  "/api/incidents/[id]": {
    GET: { incident: Incident };
    PATCH: Incident;
    DELETE: { success: boolean };
  };
  "/api/healthchecks": {
    GET: {
      healthChecks: HealthCheck[];
      pagination: PaginationMetadata;
    };
  };
  "/api/alerts": {
    GET: {
      alerts: Alert[];
      pagination: PaginationMetadata;
    };
  };
  "/api/settings": {
    GET: { settings: Settings };
    PATCH: Settings;
  };
  "/api/groups": {
    GET: { groups: Group[] };
    POST: Group;
  };
  "/api/groups/[id]": {
    GET: { group: Group };
    PATCH: Group;
    DELETE: { success: boolean };
  };
  "/api/config/users": {
    GET: { users: User[] };
    POST: User;
  };
  "/api/config/users/[id]": {
    PATCH: User;
    DELETE: { success: boolean };
  };
  "/api/users": {
    GET: { users: User[] };
    POST: User;
  };
  "/api/users/[id]": {
    PATCH: User;
    DELETE: { success: boolean };
  };
  "/api/auth/login": {
    POST: { user: User };
  };
  "/api/auth/logout": {
    POST: { success: boolean };
  };
  "/api/auth/me": {
    GET: {
      user: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "viewer";
      };
    };
  };
};

// Helper type to extract GET response type for a given URL
export type GetResponse<TUrl extends keyof ApiResponseMap> =
  ApiResponseMap[TUrl] extends { GET: infer TResponse } ? TResponse : never;

// Helper type to extract response type for a given URL and method
export type ApiResponse<
  TUrl extends keyof ApiResponseMap,
  TMethod extends keyof ApiResponseMap[TUrl],
> = ApiResponseMap[TUrl][TMethod];

// Helper type to check if a URL supports a specific method
export type SupportsMethod<
  TUrl extends keyof ApiResponseMap,
  TMethod extends string,
> = TMethod extends keyof ApiResponseMap[TUrl] ? TUrl : never;

// Export individual types for use in components
export type { Service, Incident, HealthCheck, Settings, Group, User };
