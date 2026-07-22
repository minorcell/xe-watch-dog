import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { buildSchedulerTasks, recordRun } from "@/lib/scheduler-tasks";
import { runScheduler } from "@/lib/scheduler";

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });

  try {
    const tasks = await buildSchedulerTasks();
    const results = await runScheduler(tasks);
    recordRun({ tasks: results, ranAt: new Date().toISOString() });
    return NextResponse.json({ tasks: results });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "同步失败" }, { status: 503 });
  }
}
