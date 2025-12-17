import { ObjectId } from "mongodb";

// Group interface for organizing services by team
export interface Group {
  _id: ObjectId;
  id: string; // UUID
  name: string; // e.g., "Frontend Team", "Backend Team", "Data Team"
  description?: string;
  webhookUrls: string[]; // Multiple Teams webhook URLs for this group
  color?: string; // Optional color for UI (e.g., "#667eea")
  createdAt: Date;
  updatedAt: Date;
}

// DTO for creating a group
export interface CreateGroupInput {
  name: string;
  description?: string;
  webhookUrls: string[];
  color?: string;
}

// DTO for updating a group
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  webhookUrls?: string[];
  color?: string;
}
