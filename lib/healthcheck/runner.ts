import { HealthCheckResult } from "@/lib/types/healthcheck";
import { MongoClient } from "mongodb";
import { Client as ElasticsearchClient } from "@elastic/elasticsearch";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Sleep utility for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Run API/HTTP health check with retries
export async function runApiHealthCheck(
  url: string,
  method: string = "GET",
  timeout: number = 5000,
  headers?: Record<string, string>,
  body?: string,
  retries: number = 0
): Promise<HealthCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = Date.now();
    const fetchOptions: RequestInit = {
      signal: controller.signal,
      method,
      headers: {
        "User-Agent": "ZStatus Health Monitor",
        ...headers,
      },
    };

    // Add body for POST/PUT/PATCH
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;

    clearTimeout(timeoutId);
    console.log(url, response.ok, response.status);

    // Consider 2xx and 3xx as successful
    if (response.ok || response.status < 400) {
      return {
        status: "UP",
        responseTime,
        statusCode: response.status,
      };
    } else {
      return {
        status: "DOWN",
        responseTime,
        statusCode: response.status,
        errorMessage: `HTTP ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if we should retry
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      console.log(
        `[HealthCheck] Retry ${
          retries + 1
        }/${MAX_RETRIES} for ${url} after ${delay}ms`
      );
      await sleep(delay);
      return runApiHealthCheck(
        url,
        method,
        timeout,
        headers,
        body,
        retries + 1
      );
    }

    const responseTime = timeout;
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = `Timeout after ${timeout}ms`;
      } else if (error.message.includes("fetch failed")) {
        errorMessage = "Connection failed";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
    };
  }
}

// Run MongoDB health check
export async function runMongoHealthCheck(
  connectionString: string,
  database: string = "admin",
  timeout: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  let client: MongoClient | null = null;

  try {
    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
    });

    await client.connect();

    // Run a simple ping command
    const db = client.db(database);
    await db.collection("healthchecks").aggregate([]);

    const responseTime = Date.now() - startTime;

    return {
      status: "UP",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = "MongoDB connection failed";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
    };
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("[MongoDB] Error closing connection:", closeError);
      }
    }
  }
}

// Run Elasticsearch health check
export async function runElasticsearchHealthCheck(
  connectionString: string,
  timeout: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const client = new ElasticsearchClient({
      node: connectionString,
      requestTimeout: timeout,
    });

    // Check cluster health
    const health = await client.cluster.health();

    const responseTime = Date.now() - startTime;

    // Consider yellow and green as UP
    if (health.status === "green" || health.status === "yellow") {
      return {
        status: "UP",
        responseTime,
      };
    } else {
      return {
        status: "DOWN",
        responseTime,
        errorMessage: `Cluster status: ${health.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = "Elasticsearch connection failed";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
    };
  }
}

// Main health check function - delegates to appropriate runner
export async function runHealthCheck(
  serviceType: string,
  config: {
    // API fields
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    // MongoDB fields
    mongoConnectionString?: string;
    mongoDatabase?: string;
    // Elasticsearch fields
    esConnectionString?: string;
    // Common
    timeout?: number;
  }
): Promise<HealthCheckResult> {
  const timeout = config.timeout || 5000;

  switch (serviceType) {
    case "api":
      if (!config.url) {
        throw new Error("URL is required for API health checks");
      }
      return runApiHealthCheck(
        config.url,
        config.method || "GET",
        timeout,
        config.headers,
        config.body
      );

    case "mongodb":
      if (!config.mongoConnectionString) {
        throw new Error(
          "Connection string is required for MongoDB health checks"
        );
      }
      return runMongoHealthCheck(
        config.mongoConnectionString,
        config.mongoDatabase || "admin",
        timeout
      );

    case "elasticsearch":
      if (!config.esConnectionString) {
        throw new Error(
          "Connection string is required for Elasticsearch health checks"
        );
      }
      return runElasticsearchHealthCheck(config.esConnectionString, timeout);

    default:
      throw new Error(`Unsupported service type: ${serviceType}`);
  }
}
