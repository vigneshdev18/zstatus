import { Collection, ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { ServiceSecret } from "@/lib/types/service-secret";

export const SERVICE_SECRETS_COLLECTION = "service_secrets";

export async function getServiceSecretsCollection(): Promise<
  Collection<ServiceSecret>
> {
  const db = await getDatabase();
  return db.collection<ServiceSecret>(SERVICE_SECRETS_COLLECTION);
}

export async function createServiceSecrets(
  serviceId: string,
  secrets: Partial<ServiceSecret>,
): Promise<void> {
  // Only create if there are actually secrets to store
  const hasSecrets = Object.values(secrets).some(
    (val) => val !== undefined && val !== "",
  );
  if (!hasSecrets) return;

  const collection = await getServiceSecretsCollection();
  await collection.insertOne({
    ...secrets,
    serviceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getServiceSecrets(
  serviceId: string,
): Promise<ServiceSecret | null> {
  const collection = await getServiceSecretsCollection();
  return collection.findOne({ serviceId });
}

export async function updateServiceSecrets(
  serviceId: string,
  secrets: Partial<ServiceSecret>,
): Promise<void> {
  const collection = await getServiceSecretsCollection();

  // Filter out undefined values and empty strings to avoid overwriting with null/undefined/" "
  const updateData: Partial<ServiceSecret> = {};
  Object.entries(secrets).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      // @ts-ignore
      updateData[key] = value;
    }
  });

  if (Object.keys(updateData).length === 0) return;

  await collection.updateOne(
    { serviceId },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function deleteServiceSecrets(serviceId: string): Promise<void> {
  const collection = await getServiceSecretsCollection();
  await collection.deleteOne({ serviceId });
}
