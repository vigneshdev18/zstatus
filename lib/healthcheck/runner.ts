import { HealthCheckResult, ErrorType } from "@/lib/types/healthcheck";
import { MongoClient } from "mongodb";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Sleep utility for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS,
  serviceName: string = "service",
): Promise<{ result: T; retryCount: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retryCount: attempt };
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt); // Exponential backoff
        console.log(
          `[HealthCheck] Retry ${
            attempt + 1
          }/${maxRetries} for ${serviceName} after ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Classify error into categories for better alerting
 */
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (error.name === "AbortError" || message.includes("timeout")) {
    return "TIMEOUT";
  }
  if (
    message.includes("econnrefused") ||
    message.includes("connection") ||
    message.includes("fetch failed")
  ) {
    return "CONNECTION";
  }
  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("403") ||
    message.includes("401")
  ) {
    return "AUTH";
  }
  if (
    message.includes("invalid") ||
    message.includes("parse") ||
    message.includes("json")
  ) {
    return "VALIDATION";
  }

  return "UNKNOWN";
}

/**
 * Get Elasticsearch authentication headers
 */
function getElasticsearchHeaders(auth?: {
  username?: string;
  password?: string;
  apiKey?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth?.apiKey) {
    headers["Authorization"] = `ApiKey ${auth.apiKey}`;
  } else if (auth?.username && auth?.password) {
    const credentials = Buffer.from(
      `${auth.username}:${auth.password}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }

  return headers;
}

// Run API/HTTP health check with retries
export async function runApiHealthCheck(
  url: string,
  method: string = "GET",
  timeout: number = 5000,
  headers?: Record<string, string>,
  body?: string,
  retries: number = 0,
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
        errorType:
          response.status === 401 || response.status === 403
            ? "AUTH"
            : "UNKNOWN",
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
        }/${MAX_RETRIES} for ${url} after ${delay}ms`,
      );
      await sleep(delay);
      return runApiHealthCheck(
        url,
        method,
        timeout,
        headers,
        body,
        retries + 1,
      );
    }

    const responseTime = timeout;
    let errorMessage = "Unknown error";
    let errorType: ErrorType = "UNKNOWN";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = classifyError(error);

      if (error.name === "AbortError") {
        errorMessage = `Timeout after ${timeout}ms`;
      } else if (error.message.includes("fetch failed")) {
        errorMessage = "Connection failed";
      }
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
      errorType,
    };
  }
}

// Run MongoDB health check
export async function runMongoHealthCheck(
  connectionString: string,
  database: string = "admin",
  timeout: number = 5000,
  pipelines?: Array<{ collection: string; pipeline: any[] }>,
  options?: {
    maxRetries?: number;
    retryDelayMs?: number;
    useConnectionPool?: boolean;
  },
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? RETRY_DELAY_MS;
  const usePool = options?.useConnectionPool ?? false;

  let client: MongoClient | null = null;
  let shouldCloseClient = true;

  try {
    const { retryCount } = await withRetry(
      async () => {
        if (usePool) {
          // Use connection pool
          const { connectionPool } = await import("./connection-pool");
          client = await connectionPool.getMongoClient(
            connectionString,
            timeout,
          );
          shouldCloseClient = false; // Don't close pooled connections
        } else {
          // Create new connection
          client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: timeout,
            connectTimeoutMS: timeout,
          });
          await client.connect();
        }

        const db = client.db(database);

        // If pipelines are provided, execute them sequentially
        if (pipelines && pipelines.length > 0) {
          for (const pipelineConfig of pipelines) {
            const { collection, pipeline } = pipelineConfig;
            await db.collection(collection).aggregate(pipeline).toArray();
          }
        } else {
          // Default: Use admin ping command (more efficient than aggregate)
          await db.admin().ping();
        }

        return true;
      },
      maxRetries,
      retryDelayMs,
      "MongoDB",
    );

    const responseTime = Date.now() - startTime;

    return {
      status: "UP",
      responseTime,
      metadata: { retryCount },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = "MongoDB connection failed";
    let errorType: ErrorType = "UNKNOWN";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = classifyError(error);
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
      errorType,
    };
  } finally {
    if (client && shouldCloseClient) {
      try {
        await (client as MongoClient).close();
      } catch (closeError) {
        console.error("[MongoDB] Error closing connection:", closeError);
      }
    }
  }
}

// Run Elasticsearch health check
export async function runElasticsearchHealthCheck(
  connectionString: string,
  timeout: number = 5000,
  options?: {
    index?: string;
    query?: string; // JSON string of the query body
    username?: string;
    password?: string;
    apiKey?: string;
    maxRetries?: number;
    retryDelayMs?: number;
  },
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? RETRY_DELAY_MS;

  // Validate timeout bounds (1s to 30s)
  const validTimeout = Math.max(1000, Math.min(timeout, 30000));
  if (validTimeout !== timeout) {
    console.warn(
      `[Elasticsearch] Timeout ${timeout}ms adjusted to ${validTimeout}ms (valid range: 1000-30000ms)`,
    );
  }

  try {
    // Validate JSON query before making request
    if (options?.query) {
      try {
        JSON.parse(options.query);
      } catch (parseError) {
        return {
          status: "DOWN",
          responseTime: 0,
          errorMessage: "Invalid JSON query",
          errorType: "VALIDATION",
        };
      }
    }

    const { retryCount } = await withRetry(
      async () => {
        // If index and query are provided, run a search query
        if (options?.index && options?.query) {
          const queryBody = JSON.parse(options.query);

          // Add response size limit to prevent memory issues
          if (!queryBody.size) {
            queryBody.size = 10; // Default limit
          } else if (queryBody.size > 100) {
            queryBody.size = 100; // Cap at 100 results
            console.warn(
              `[Elasticsearch] Query size capped at 100 (requested: ${queryBody.size})`,
            );
          }

          // Use plain HTTP request to avoid version compatibility issues
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), validTimeout);

          const response = await fetch(
            `${connectionString}/${options.index}/_search`,
            {
              method: "POST",
              headers: getElasticsearchHeaders({
                username: options.username,
                password: options.password,
                apiKey: options.apiKey,
              }),
              body: JSON.stringify(queryBody),
              signal: controller.signal,
            },
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            return { success: true };
          } else {
            const errorText = await response.text();
            throw new Error(
              `Search query failed: ${response.status} ${errorText}`,
            );
          }
        } else {
          // Default: Check cluster health using plain HTTP
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), validTimeout);

          const response = await fetch(`${connectionString}/_cluster/health`, {
            method: "GET",
            headers: getElasticsearchHeaders({
              username: options?.username,
              password: options?.password,
              apiKey: options?.apiKey,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const health = await response.json();

            // Consider yellow and green as UP
            if (health.status === "green" || health.status === "yellow") {
              return { success: true };
            } else {
              throw new Error(`Cluster status: ${health.status}`);
            }
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        }
      },
      maxRetries,
      retryDelayMs,
      "Elasticsearch",
    );

    const responseTime = Date.now() - startTime;

    return {
      status: "UP",
      responseTime,
      metadata: { retryCount },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = "Elasticsearch connection failed";
    let errorType: ErrorType = "UNKNOWN";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = classifyError(error);
    }

    return {
      status: "DOWN",
      responseTime,
      errorMessage,
      errorType,
    };
  }
}

// Run Redis health check with multiple operations
export async function runRedisHealthCheck(
  connectionString: string,
  timeout: number = 5000,
  options?: {
    password?: string;
    database?: number;
    operations?: Array<{ command: string; args: string[] }>;
    keys?: string[]; // Keys to test with read/write operations
    maxRetries?: number;
    retryDelayMs?: number;
    useConnectionPool?: boolean;
  },
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  // Dynamic import to avoid bundling issues
  const Redis = (await import("ioredis")).default;
  let client: InstanceType<typeof Redis> | null = null;

  try {
    // Create Redis client with error suppression
    client = new Redis(connectionString, {
      password: options?.password,
      db: options?.database || 0,
      connectTimeout: timeout,
      commandTimeout: timeout,
      lazyConnect: true,
      maxRetriesPerRequest: 1, // Limit retries for faster failure
      enableOfflineQueue: false, // Don't queue commands when disconnected
      retryStrategy: () => null, // Don't retry connections
    });

    // Immediately attach error handler to catch all errors
    let connectionError: Error | null = null;
    client.on("error", (err) => {
      connectionError = err;
      // Suppress the error event - we'll handle it in the catch block
    });

    // Connect to Redis with proper error handling
    try {
      await client.connect();

      // If there was a connection error, throw it
      if (connectionError) {
        throw connectionError;
      }
    } catch (connectErr) {
      // Re-throw to be caught by outer try-catch
      throw connectErr;
    }

    let totalReadTime = 0;
    let totalWriteTime = 0;
    let readCount = 0;
    let writeCount = 0;

    // If keys are specified, perform read/write operations on them
    if (options?.keys && options.keys.length > 0) {
      const testValue = `zstatus_healthcheck_${Date.now()}`;

      for (const key of options.keys) {
        // Perform WRITE operation (SET)
        const writeStart = Date.now();
        await client.set(key, testValue, "EX", 60); // Set with 60s expiry
        const writeTime = Date.now() - writeStart;
        totalWriteTime += writeTime;
        writeCount++;

        // Perform READ operation (GET)
        const readStart = Date.now();
        await client.get(key);
        const readTime = Date.now() - readStart;
        totalReadTime += readTime;
        readCount++;
      }
    } else if (options?.operations && options.operations.length > 0) {
      // Execute custom operations if provided
      for (const operation of options.operations) {
        const { command, args } = operation;
        // @ts-ignore - Dynamic command execution
        await client.call(command, ...args);
      }
    } else {
      // Default to PING if no operations or keys configured
      await client.ping();
    }

    const responseTime = Date.now() - startTime;

    // Calculate averages
    const avgReadTime =
      readCount > 0 ? Math.round(totalReadTime / readCount) : undefined;
    const avgWriteTime =
      writeCount > 0 ? Math.round(totalWriteTime / writeCount) : undefined;

    return {
      status: "UP",
      responseTime,
      metadata: {
        readResponseTime: avgReadTime,
        writeResponseTime: avgWriteTime,
        keysChecked: options?.keys?.length || 0,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = "Redis connection failed";

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
        // Only try to quit if the client is connected
        if (client.status === "ready" || client.status === "connect") {
          await client.quit();
        } else {
          // Just disconnect without waiting for graceful shutdown
          client.disconnect();
        }
      } catch (closeError) {
        // Silently ignore close errors - connection is already failed
      }
    }
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
    mongoPipelines?: Array<{ collection: string; pipeline: any[] }>;
    // Elasticsearch fields
    esConnectionString?: string;
    esIndex?: string;
    esQuery?: string;
    esUsername?: string;
    esPassword?: string;
    esApiKey?: string;
    // Redis fields
    redisConnectionString?: string;
    redisPassword?: string;
    redisDatabase?: number;
    redisOperations?: Array<{ command: string; args: string[] }>;
    redisKeys?: string[];
    // Common
    timeout?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    useConnectionPool?: boolean;
  },
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
        config.body,
      );

    case "mongodb":
      if (!config.mongoConnectionString) {
        throw new Error(
          "Connection string is required for MongoDB health checks",
        );
      }
      return runMongoHealthCheck(
        config.mongoConnectionString,
        config.mongoDatabase || "admin",
        timeout,
        config.mongoPipelines,
        {
          maxRetries: config.maxRetries,
          retryDelayMs: config.retryDelayMs,
          useConnectionPool: config.useConnectionPool,
        },
      );

    case "elasticsearch":
      if (!config.esConnectionString) {
        throw new Error(
          "Connection string is required for Elasticsearch health checks",
        );
      }
      return runElasticsearchHealthCheck(config.esConnectionString, timeout, {
        index: config.esIndex,
        query: config.esQuery,
        username: config.esUsername,
        password: config.esPassword,
        apiKey: config.esApiKey,
        maxRetries: config.maxRetries,
        retryDelayMs: config.retryDelayMs,
      });

    case "redis":
      if (!config.redisConnectionString) {
        throw new Error(
          "Connection string is required for Redis health checks",
        );
      }

      return runRedisHealthCheck(config.redisConnectionString, timeout, {
        password: config.redisPassword,
        database: config.redisDatabase,
        operations: config.redisOperations,
        keys: config.redisKeys,
        maxRetries: config.maxRetries,
        retryDelayMs: config.retryDelayMs,
        useConnectionPool: config.useConnectionPool,
      });

    default:
      throw new Error(`Unsupported service type: ${serviceType}`);
  }
}
