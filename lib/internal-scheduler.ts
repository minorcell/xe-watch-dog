/**
 * Internal scheduler for self-hosted / Docker deployments.
 * Only activates when VERCEL env is NOT set.
 * Uses node-cron to trigger the same logic as /api/cron/stars.
 */
import cron from "node-cron";

import { getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos, fetchRepoMetadata } from "@/lib/github";
import { bulkUpsertOrgRepos, getEnabledTaskNames, getMonitoredRepos, syncRepoMetadata } from "@/lib/database";
import { collectStarSnapshots } from "@/lib/stars";

let started = false;

export function startInternalScheduler() {
  if (started) return;
  if (process.env.VERCEL) return; // Only for self-hosted

  const schedule = process.env.CRON_SCHEDULE ?? "0 1 * * *"; // Default: daily 1am UTC
  const org = getGitHubEnv().GITHUB_ORG;
  if (!org) {
    console.warn("[scheduler] GITHUB_ORG not set — skipping internal scheduler");
    return;
  }

  started = true;
  console.log(`[scheduler] Starting internal cron: ${schedule} (no Vercel detected)`);

  cron.schedule(schedule, async () => {
    console.log("[scheduler] Running...");
    const enabledTasks = await getEnabledTaskNames();

    if (enabledTasks.includes("sync-org-repos")) {
      try {
        const repos = await fetchOrgRepos(org);
        const result = await bulkUpsertOrgRepos(repos);
        console.log(`[scheduler] sync-org-repos: +${result.added} ~${result.updated}`);
      } catch (e) { console.error("[scheduler] sync-org-repos failed", e); }
    }

    if (enabledTasks.includes("sync-repo-metadata")) {
      try {
        const repos = await getMonitoredRepos();
        let n = 0;
        for (const r of repos) {
          try { const [o, n2] = r.split("/"); await syncRepoMetadata(r, await fetchRepoMetadata(o, n2)); n++; } catch { /* skip */ }
        }
        console.log(`[scheduler] sync-repo-metadata: ${n}/${repos.length}`);
      } catch (e) { console.error("[scheduler] sync-repo-metadata failed", e); }
    }

    if (enabledTasks.includes("collect-star-snapshots")) {
      try {
        const r = await collectStarSnapshots();
        console.log(`[scheduler] collect-star-snapshots: saved=${r.saved} failed=${r.failed}`);
      } catch (e) { console.error("[scheduler] collect-star-snapshots failed", e); }
    }

    console.log("[scheduler] Done.");
  });
}
