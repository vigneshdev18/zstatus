import { ObjectId } from "mongodb";

// Alert severity levels
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

// Alert types
export type AlertType =
  | "INCIDENT_OPENED"
  | "INCIDENT_CLOSED"
  | "SERVICE_DEGRADED"
  | "RESPONSE_TIME";

// Notification channel types
export type NotificationChannel = "teams" | "email" | "slack";

// Alert status
export type AlertStatus = "PENDING" | "SENT" | "FAILED";

// Alert interface
export interface Alert {
  _id: ObjectId;
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
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance window interface
export interface MaintenanceWindow {
  _id: ObjectId;
  id: string;
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
