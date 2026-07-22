import { NextResponse } from "next/server";

import { getCronSecret, getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos, fetchRepoMetadata } from "@/lib/github";
import { collectStarSnapshots } from "@/lib/stars";
import { bulkUpsertOrgRepos, getEnabledTaskNames, getMonitoredRepos, syncRepoMetadata } from "@/lib/database";
import { runScheduler, type ScheduledTask } from "@/lib/scheduler";

export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) return NextResponse.json({ message: "CRON_SECRET 未配置" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  const enabledTasks = await getEnabledTaskNames();
  const org = getGitHubEnv().GITHUB_ORG ?? "1024XEngineer";
  const allTasks: ScheduledTask[] = [];

  if (enabledTasks.includes("sync-org-repos")) {
    allTasks.push({
      name: "sync-org-repos",
      run: async () => {
        const repos = await fetchOrgRepos(org);
        const result = await bulkUpsertOrgRepos(repos);
        return { ok: true, message: `新增 ${result.added}，更新 ${result.updated}`, detail: result };
      },
    });
  }

  if (enabledTasks.includes("sync-repo-metadata")) {
    allTasks.push({
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
    allTasks.push({
      name: "collect-star-snapshots",
      run: async () => {
        const result = await collectStarSnapshots();
        return { ok: result.failed === 0, message: `采集 ${result.saved} 个仓库` + (result.failed > 0 ? `，${result.failed} 失败` : "") };
      },
    });
  }

  const results = await runScheduler(allTasks);
  const hasFailure = results.some((r) => !r.ok);
  console.log("[cron]", JSON.stringify(results));
  return NextResponse.json({ tasks: results }, { status: hasFailure ? 500 : 200 });
}
