import cron from "node-cron";

import { runGitHubSync } from "@/lib/github-sync";

let started = false;

export function startInternalScheduler() {
  if (started) return;
  if (process.env.VERCEL) return;

  const schedule = process.env.CRON_SCHEDULE ?? "0 1 * * *";
  started = true;
  console.log(`[scheduler] Internal cron: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log("[scheduler] Running...");
    try {
      const run = await runGitHubSync("internal-cron");
      console.log("[scheduler] Done.", JSON.stringify({ runId: run.id, status: run.status }));
    } catch (error) {
      console.error("[scheduler] Failed.", error);
    }
  }, { timezone: "UTC", noOverlap: true });
}
