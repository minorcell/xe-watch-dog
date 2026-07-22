import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGitHubEnv } from "@/lib/env";
import { fetchRepoMetadata } from "@/lib/github";
import { runScheduler } from "@/lib/scheduler";
import { collectStarSnapshots } from "@/lib/stars";
import { getMonitoredRepos, syncRepoMetadata } from "@/lib/database";

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });

  try {
    const results = await runScheduler([
      {
        name: "sync-repo-metadata",
        run: async () => {
          const repos = await getMonitoredRepos();
          let synced = 0;
          for (const r of repos) {
            try { const [o, n] = r.split("/"); await syncRepoMetadata(r, await fetchRepoMetadata(o, n)); synced++; } catch { /* skip */ }
          }
          return { ok: true, message: `同步 ${synced} 个仓库元信息` };
        },
      },
      {
        name: "collect-star-snapshots",
        run: async () => {
          const result = await collectStarSnapshots();
          return { ok: true, message: `采集 ${result.saved} 个仓库` + (result.failed > 0 ? `，${result.failed} 失败` : "") };
        },
      },
    ]);
    return NextResponse.json({ tasks: results });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "同步失败" }, { status: 503 });
  }
}
