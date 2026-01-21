import { getDatabase } from "@/lib/mongodb";
import { ServiceSecret } from "@/lib/types/service-secret";
import { createServiceSecrets } from "@/lib/db/service-secrets";
import { Service } from "@/lib/types/service";

const SERVICES_COLLECTION = "services";

export async function migrateServiceSecrets(): Promise<{
  success: number;
  failed: number;
  total: number;
  errors: string[];
}> {
  console.log("Starting service secrets migration...");
  const db = await getDatabase();
  const services = await db
    .collection<Service>(SERVICES_COLLECTION)
    .find({})
    .toArray();

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const service of services) {
    try {
      // Extract secrets from the service document
      // Note: We need to cast to any because the types have already been updated
      // to remove these fields, but they still exist in the DB
      const serviceAny = service as any;

      const secrets: Partial<ServiceSecret> = {
        mongoConnectionString: serviceAny.mongoConnectionString,
        esConnectionString: serviceAny.esConnectionString,
        esUsername: serviceAny.esUsername,
        esPassword: serviceAny.esPassword,
        esApiKey: serviceAny.esApiKey,
        redisConnectionString: serviceAny.redisConnectionString,
        redisPassword: serviceAny.redisPassword,
      };

      // Filter out undefined secrets
      const hasSecrets = Object.values(secrets).some(
        (val) => val !== undefined && val !== "",
      );

      if (hasSecrets) {
        console.log(
          `Migrating secrets for service: ${service.name} (${service.id})`,
        );

        // Create secrets document
        await createServiceSecrets(service.id, secrets);

        // Remove secrets from service document
        await db.collection(SERVICES_COLLECTION).updateOne(
          { id: service.id },
          {
            $unset: {
              mongoConnectionString: "",
              esConnectionString: "",
              esUsername: "",
              esPassword: "",
              esApiKey: "",
              redisConnectionString: "",
              redisPassword: "",
            },
            $set: {
              updatedAt: new Date(),
            },
          },
        );
        success++;
      } else {
        console.log(
          `No secrets to migrate for service: ${service.name} (${service.id})`,
        );
      }
    } catch (error) {
      console.error(`Failed to migrate service ${service.id}:`, error);
      failed++;
      errors.push(
        `Service ${service.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  console.log(
    `Migration completed. Total: ${services.length}, Success: ${success}, Failed: ${failed}`,
  );

  return {
    success,
    failed,
    total: services.length,
    errors,
  };
}
