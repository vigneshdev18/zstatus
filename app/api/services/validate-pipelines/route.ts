import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// POST /api/services/validate-pipelines - Validate MongoDB pipelines
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null;

  try {
    const body = await request.json();
    const { connectionString, database, pipelines } = body;

    // Validate required fields
    if (!connectionString || !database || !pipelines) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: connectionString, database, pipelines",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(pipelines) || pipelines.length === 0) {
      return NextResponse.json(
        { error: "Pipelines must be a non-empty array" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    const db = client.db(database);

    // Validate each pipeline
    const errors: Array<{ collection: string; error: string }> = [];

    for (const pipelineConfig of pipelines) {
      const { collection, pipeline } = pipelineConfig;

      if (!collection || !pipeline) {
        errors.push({
          collection: collection || "unknown",
          error: "Missing collection or pipeline",
        });
        continue;
      }

      if (!Array.isArray(pipeline)) {
        errors.push({
          collection,
          error: "Pipeline must be an array",
        });
        continue;
      }

      try {
        // Test the pipeline by executing it with a limit
        await db.collection(collection).aggregate(pipeline).limit(1).toArray();
      } catch (error) {
        errors.push({
          collection,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Return validation result
    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
      });
    }

    return NextResponse.json({
      valid: true,
      message: `Successfully validated ${pipelines.length} pipeline(s)`,
    });
  } catch (error) {
    console.error("[API] Error validating pipelines:", error);
    return NextResponse.json(
      {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate pipelines",
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("[API] Error closing MongoDB connection:", closeError);
      }
    }
  }
}
