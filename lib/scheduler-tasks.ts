import { getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos, fetchRepoMetadata } from "@/lib/github";
import { bulkUpsertOrgRepos, getEnabledTaskNames, getMonitoredRepos, syncRepoMetadata } from "@/lib/database";
import { collectStarSnapshots } from "@/lib/stars";
import type { ScheduledTask } from "@/lib/scheduler";

/** Build the task list from enabled tasks in the database. */
export async function buildSchedulerTasks(): Promise<ScheduledTask[]> {
  const enabledTasks = await getEnabledTaskNames();
  const org = getGitHubEnv().GITHUB_ORG;
  if (!org) throw new Error("GITHUB_ORG 未配置");

  const tasks: ScheduledTask[] = [];

  if (enabledTasks.includes("sync-org-repos")) {
    tasks.push({
      name: "sync-org-repos",
      run: async () => {
        const repos = await fetchOrgRepos(org);
        const result = await bulkUpsertOrgRepos(repos);
        return { ok: true, message: `新增 ${result.added}，更新 ${result.updated}`, detail: result };
      },
    });
  }

  if (enabledTasks.includes("sync-repo-metadata")) {
    tasks.push({
      name: "sync-repo-metadata",
      run: async () => {
        const repos = await getMonitoredRepos();
        let synced = 0;
        for (const r of repos) {
          try { const [o, n] = r.split("/"); await syncRepoMetadata(r, await fetchRepoMetadata(o, n)); synced++; } catch { /* skip */ }
        }
        return { ok: true, message: `同步 ${synced}/${repos.length} 个仓库` };
      },
    });
  }

  if (enabledTasks.includes("collect-star-snapshots")) {
    tasks.push({
      name: "collect-star-snapshots",
      run: async () => {
        const result = await collectStarSnapshots();
        return { ok: result.failed === 0, message: `采集 ${result.saved} 个仓库` + (result.failed > 0 ? `，${result.failed} 失败` : "") };
      },
    });
  }

  return tasks;
}

import type { TaskResult } from "@/lib/scheduler";

export type SchedulerRunRecord = {
  tasks: TaskResult[];
  ranAt: string;
};

let lastRun: SchedulerRunRecord | null = null;

export function recordRun(record: SchedulerRunRecord) {
  lastRun = record;
}

export function getLastRun(): SchedulerRunRecord | null {
  return lastRun;
}
