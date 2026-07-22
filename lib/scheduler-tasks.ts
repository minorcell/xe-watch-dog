import { getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos, fetchRepoMetadata } from "@/lib/github";
import { bulkUpsertOrgRepos, getEnabledTaskNames, getMonitoredRepos, syncRepoMetadata } from "@/lib/database";
import { collectStarSnapshots } from "@/lib/stars";
import type { ScheduledTask, TaskResult } from "@/lib/scheduler";

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

// ── Persisted run records ────────────────────────────────────

export async function recordRun(results: TaskResult[]) {
  const { neon } = await import("@neondatabase/serverless");
  const { getDatabaseUrl } = await import("@/lib/env");
  const url = getDatabaseUrl();
  if (!url) return;
  const sql = neon(url);
  await sql`INSERT INTO scheduler_runs (ran_at, results) VALUES (NOW(), ${JSON.stringify(results)}::jsonb)`;
}

export async function getLastRun() {
  const { neon } = await import("@neondatabase/serverless");
  const { getDatabaseUrl } = await import("@/lib/env");
  const url = getDatabaseUrl();
  if (!url) return null;
  const sql = neon(url);
  const [row] = await sql`SELECT ran_at AS "ranAt", results FROM scheduler_runs ORDER BY ran_at DESC LIMIT 1`;
  if (!row) return null;
  return {
    ranAt: row.ranAt as string,
    tasks: (row.results as TaskResult[]).map((t) => ({
      task: t.task,
      ok: t.ok,
      message: t.message,
    })),
  };
}
