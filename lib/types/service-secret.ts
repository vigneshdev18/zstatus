import { ObjectId } from "mongodb";

export interface ServiceSecret {
  _id?: ObjectId;
  serviceId: string; // References Service.id

  // MongoDB secrets
  mongoConnectionString?: string;

  // Elasticsearch secrets
  esConnectionString?: string;
  esUsername?: string;
  esPassword?: string;
  esApiKey?: string;

  // Redis secrets
  redisConnectionString?: string;
  redisPassword?: string;

  createdAt: Date;
  updatedAt: Date;
}
