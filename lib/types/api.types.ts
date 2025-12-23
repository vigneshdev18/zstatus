// API Response Type Definitions
// This file defines the shape of all API responses for type-safe API calls

interface Service {
  id: string;
  name: string;
  healthCheckUrl: string;
  alertsEnabled: boolean;
  lastStatus?: "UP" | "DOWN";
  lastCheckedAt?: string;
  groupId?: string;
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

interface Settings {
  globalHealthChecksEnabled: boolean;
  globalAlertsEnabled: boolean;
  alertCooldownMinutes: number;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "VIEWER";
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
    PATCH: Service;
    DELETE: { success: boolean };
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
    GET: { healthChecks: HealthCheck[] };
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
  "/api/auth/login": {
    POST: { user: User };
  };
  "/api/auth/logout": {
    POST: { success: boolean };
  };
};

// Helper type to extract GET response type for a given URL
export type GetResponse<TUrl extends keyof ApiResponseMap> =
  ApiResponseMap[TUrl] extends { GET: infer TResponse } ? TResponse : never;

// Helper type to extract response type for a given URL and method
export type ApiResponse<
  TUrl extends keyof ApiResponseMap,
  TMethod extends keyof ApiResponseMap[TUrl]
> = ApiResponseMap[TUrl][TMethod];

// Helper type to check if a URL supports a specific method
export type SupportsMethod<
  TUrl extends keyof ApiResponseMap,
  TMethod extends string
> = TMethod extends keyof ApiResponseMap[TUrl] ? TUrl : never;

// Export individual types for use in components
export type { Service, Incident, HealthCheck, Settings, Group, User };
