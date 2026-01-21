import * as cron from "node-cron";
import { createDatabaseIndexes } from "./db/maintenance-tasks";

/**
 * Job definition for the scheduler
 *
 * Cron Expression Format:
 * - second (0-59, optional)
 * - minute (0-59)
 * - hour (0-23)
 * - day of month (1-31)
 * - month (1-12)
 * - day of week (0-7, where 0 or 7 is Sunday)
 *
 * Examples:
 * - "* * * * *" - Every minute
 * - "* 5 * * * *" - Every 5 minutes
 * - "0 * * * *" - Every hour (at minute 0)
 * - "0 0 * * *" - Every day at midnight
 * - "* 30 * * * * *" - Every 30 seconds (with seconds field)
 */
interface Job {
  name: string;
  schedule: string; // cron expression
  handler: () => Promise<void>;
}

class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
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
      `[Scheduler] Registering job: ${job.name} (schedule: ${job.schedule})`,
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
        console.log(`[Scheduler] Job ${job.name} will retry on next schedule`);
      }
    };

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      console.error(
        `[Scheduler] Invalid cron expression for job ${job.name}: ${job.schedule}`,
      );
      return;
    }

    // Schedule the job
    const task = cron.schedule(job.schedule, safeHandler);

    this.jobs.set(job.name, task);

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

    for (const [name, task] of this.jobs.entries()) {
      task.stop();
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
      executions: Object.fromEntries(this.jobExecutionCounts),
      failures: Object.fromEntries(this.jobFailureCounts),
    };
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
