import { NextResponse } from "next/server";
import { scheduler } from "@/lib/scheduler";

export async function GET() {
  const status = scheduler.getStatus();

  return NextResponse.json({
    message: "Scheduler is running",
    ...status,
  });
}
