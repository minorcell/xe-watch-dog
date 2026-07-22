import cron from "node-cron";

import { buildSchedulerTasks, recordRun } from "@/lib/scheduler-tasks";
import { runScheduler } from "@/lib/scheduler";

let started = false;

export function startInternalScheduler() {
  if (started) return;
  if (process.env.VERCEL) return;

  const schedule = process.env.CRON_SCHEDULE ?? "0 1 * * *";
  started = true;
  console.log(`[scheduler] Internal cron: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log("[scheduler] Running...");
    const tasks = await buildSchedulerTasks();
    const results = await runScheduler(tasks);
    await recordRun();
    console.log("[scheduler] Done.", JSON.stringify(results));
  });
}
