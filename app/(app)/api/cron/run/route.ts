import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { buildSchedulerTasks, recordRun } from "@/lib/scheduler-tasks";
import { runScheduler } from "@/lib/scheduler";

export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) return NextResponse.json({ message: "CRON_SECRET 未配置" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const tasks = await buildSchedulerTasks();
  const results = await runScheduler(tasks);
  await recordRun();

  const hasFailure = results.some((r) => !r.ok);
  console.log("[cron]", JSON.stringify(results));
  return NextResponse.json({ tasks: results }, { status: hasFailure ? 500 : 200 });
}
