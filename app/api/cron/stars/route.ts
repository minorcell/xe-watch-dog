import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos, fetchRepoMetadata, fetchTeamMembers } from "@/lib/github";
import { collectStarSnapshots } from "@/lib/stars";
import { bulkUpsertOrgRepos, ensureSchedulerTasks, getEnabledTaskNames, getMonitoredRepos, syncRepoMetadata, upsertPerson } from "@/lib/database";
import { runScheduler, type ScheduledTask } from "@/lib/scheduler";

export async function GET(request: Request) {
  const cronSecret = getCronSecret();
  if (!cronSecret) return NextResponse.json({ message: "CRON_SECRET 尚未配置" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  await ensureSchedulerTasks();
  const enabledTasks = await getEnabledTaskNames();
  const org = getGitHubEnv().GITHUB_ORG ?? "1024XEngineer";

  const allTasks: ScheduledTask[] = [];

  // sync-org-repos
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

  // sync-repo-metadata
  if (enabledTasks.includes("sync-repo-metadata")) {
    allTasks.push({
      name: "sync-repo-metadata",
      run: async () => {
        const repos = await getMonitoredRepos();
        let synced = 0;
        for (const r of repos) {
          try {
            const [owner, name] = r.split("/");
            await syncRepoMetadata(r, await fetchRepoMetadata(owner, name));
            synced++;
          } catch { /* skip */ }
        }
        return { ok: true, message: `同步 ${synced}/${repos.length} 个仓库` };
      },
    });
  }

  // collect-star-snapshots
  if (enabledTasks.includes("collect-star-snapshots")) {
    allTasks.push({
      name: "collect-star-snapshots",
      run: async () => {
        const result = await collectStarSnapshots();
        return {
          ok: result.failed === 0,
          message: `采集 ${result.saved} 个仓库` + (result.failed > 0 ? `，${result.failed} 失败` : ""),
          detail: result.failed > 0 ? result.errors.slice(0, 5) : undefined,
        };
      },
    });
  }

  // sync-team-members
  if (enabledTasks.includes("sync-team-members")) {
    allTasks.push({
      name: "sync-team-members",
      run: async () => {
        const repos = await getMonitoredRepos();
        let added = 0;
        for (const r of repos) {
          try {
            const [_org, repoName] = r.split("/");
            // Try a few common team slug patterns
            const members = await fetchTeamMembers(org, repoName);
            for (const login of members) {
              await upsertPerson(login, undefined);
              added++;
            }
          } catch { /* skip */ }
        }
        return { ok: true, message: `新增 ${added} 个成员` };
      },
    });
  }

  const results = await runScheduler(allTasks);
  const hasFailure = results.some((r) => !r.ok);
  console.log("[cron]", JSON.stringify(results));
  return NextResponse.json({ tasks: results }, { status: hasFailure ? 500 : 200 });
}
