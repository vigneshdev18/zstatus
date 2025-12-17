import { createDatabaseIndexes } from "./db/maintenance-tasks";

// Job definition
interface Job {
  name: string;
  interval: number; // in milliseconds
  handler: () => Promise<void>;
}

class Scheduler {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;
  private jobExecutionCounts: Map<string, number> = new Map();
  private jobFailureCounts: Map<string, number> = new Map();

  // Register and start a new job
  registerJob(job: Job): void {
    if (this.jobs.has(job.name)) {
      console.warn(`[Scheduler] Job ${job.name} already registered`);
      return;
    }

    console.log(
      `[Scheduler] Registering job: ${job.name} (interval: ${job.interval}ms)`
    );

    this.jobExecutionCounts.set(job.name, 0);
    this.jobFailureCounts.set(job.name, 0);

    // Wrap handler with error isolation
    const safeHandler = async () => {
      try {
        const executions = this.jobExecutionCounts.get(job.name) || 0;
        this.jobExecutionCounts.set(job.name, executions + 1);

        await job.handler();
      } catch (error) {
        const failures = this.jobFailureCounts.get(job.name) || 0;
        this.jobFailureCounts.set(job.name, failures + 1);

        console.error(`[Scheduler] Error in job ${job.name}:`, error);

        // Don't crash - isolate errors to prevent cascade failures
        console.log(`[Scheduler] Job ${job.name} will retry on next interval`);
      }
    };

    // Start the interval
    const intervalId = setInterval(safeHandler, job.interval);
    this.jobs.set(job.name, intervalId);

    // Run immediately on registration
    safeHandler();
  }

  // Start the scheduler
  async start(): Promise<void> {
    if (this.running) {
      console.log("[Scheduler] Already running");
      return;
    }

    this.running = true;
    console.log("[Scheduler] Starting scheduler...");

    // Create database indexes on startup
    try {
      await createDatabaseIndexes();
    } catch (error) {
      console.error("[Scheduler] Failed to create indexes:", error);
      // Continue anyway - indexes might already exist
    }

    console.log("[Scheduler] Scheduler started successfully");
  }

  // Stop all jobs gracefully
  stop(): void {
    console.log("[Scheduler] Stopping scheduler...");
    this.running = false;

    for (const [name, intervalId] of this.jobs.entries()) {
      clearInterval(intervalId);
      console.log(`[Scheduler] Stopped job: ${name}`);
    }

    this.jobs.clear();
    console.log("[Scheduler] All jobs stopped");
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.running,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
