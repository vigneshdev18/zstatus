import { getDatabase } from "@/lib/mongodb";
import { Group, CreateGroupInput, UpdateGroupInput } from "@/lib/types/group";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";

const GROUPS_COLLECTION = "groups";

// Create a new group
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const db = await getDatabase();

  const group: Group = {
    _id: new ObjectId(),
    id: randomUUID(),
    name: input.name,
    description: input.description,
    webhookUrls: input.webhookUrls || [],
    alertEmails: input.alertEmails || [],
    color: input.color,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<Group>(GROUPS_COLLECTION).insertOne(group);
  return group;
}

// Get all groups
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDatabase();
  return await db
    .collection<Group>(GROUPS_COLLECTION)
    .find({})
    .sort({ name: 1 })
    .toArray();
}

// Get group by ID
export async function getGroupById(id: string): Promise<Group | null> {
  const db = await getDatabase();
  return await db.collection<Group>(GROUPS_COLLECTION).findOne({ id });
}

// Update group
export async function updateGroup(
  id: string,
  input: UpdateGroupInput,
): Promise<Group | null> {
  const db = await getDatabase();

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.webhookUrls !== undefined)
    updateData.webhookUrls = input.webhookUrls;
  if (input.alertEmails !== undefined)
    updateData.alertEmails = input.alertEmails;
  if (input.color !== undefined) updateData.color = input.color;

  const result = await db
    .collection<Group>(GROUPS_COLLECTION)
    .findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after" },
    );

  return result || null;
}

// Delete group
export async function deleteGroup(id: string): Promise<boolean> {
  const db = await getDatabase();

  // Note: Services with this groupId will simply have groupId set
  // We don't need to update them - they'll just have no notifications until reassigned

  const result = await db
    .collection<Group>(GROUPS_COLLECTION)
    .deleteOne({ id });
  return result.deletedCount > 0;
}

// Get group by service ID
export async function getGroupByServiceId(
  serviceId: string,
): Promise<Group | null> {
  const db = await getDatabase();

  // First get the service to find its groupId
  const service = await db.collection("services").findOne({ id: serviceId });

  if (!service || !service.groupId) {
    return null;
  }

  return await getGroupById(service.groupId);
}
