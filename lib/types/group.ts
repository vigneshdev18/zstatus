import { ObjectId } from "mongodb";

// Group interface for organizing services by team
export interface Group {
  _id: ObjectId;
  id: string; // UUID
  name: string; // e.g., "Frontend Team", "Backend Team", "Data Team"
  description?: string;
  webhookUrls: string[]; // Multiple Teams webhook URLs for this group
  alertEmails: string[]; // Email addresses to receive alerts for this group
  color?: string; // Optional color for UI (e.g., "#667eea")
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Group data as received from the API (serialized)
export interface ClientGroup {
  id: string;
  name: string;
  description?: string;
  webhookUrls: string[];
  alertEmails: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// DTO for creating a group
export interface CreateGroupInput {
  name: string;
  description?: string;
  webhookUrls: string[];
  alertEmails: string[];
  color?: string;
}

// DTO for updating a group
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  webhookUrls?: string[];
  alertEmails?: string[];
  color?: string;
}
