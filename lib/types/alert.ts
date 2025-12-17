import { ObjectId } from "mongodb";

// Alert severity levels
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

// Alert types
export type AlertType =
  | "INCIDENT_OPENED"
  | "INCIDENT_CLOSED"
  | "SERVICE_DEGRADED";

// Notification channel types
export type NotificationChannel = "teams" | "email" | "slack";

// Alert status
export type AlertStatus = "PENDING" | "SENT" | "FAILED";

// Alert interface
export interface Alert {
  _id: ObjectId;
  id: string; // UUID
  incidentId?: string; // Reference to incident
  serviceId: string; // Service that triggered the alert
  serviceName: string; // Denormalized
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  channels: NotificationChannel[];
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance window interface
export interface MaintenanceWindow {
  _id: ObjectId;
  id: string; // UUID
  serviceId: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  createdAt: Date;
}

// Alert response DTO
export interface AlertResponse {
  id: string;
  incidentId?: string;
  serviceId: string;
  serviceName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  channels: NotificationChannel[];
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}
