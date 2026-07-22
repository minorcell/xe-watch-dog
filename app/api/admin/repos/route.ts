import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGitHubEnv } from "@/lib/env";
import { fetchOrgRepos } from "@/lib/github";
import { disableMonitoring, enableMonitoring, listRepos, bulkUpsertOrgRepos } from "@/lib/database";

// GET ?detail=xxx  → single repo detail
// GET             → all repos (from DB)
export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const detail = request.nextUrl.searchParams.get("detail");
  if (detail) {
    const repos = await listRepos();
    const repo = repos.find((r) => r.githubRepo === detail);
    if (!repo) return NextResponse.json({ message: "仓库不存在" }, { status: 404 });
    return NextResponse.json(repo);
  }
  const repos = await listRepos();
  return NextResponse.json(repos);
}

// POST { action: "sync" }  → trigger GitHub org sync
// POST { action: "monitor", githubRepo } → enable monitoring
// POST { action: "unmonitor", githubRepo } → disable monitoring
export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const body = await request.json();
  const { action, githubRepo } = body;

  if (action === "sync") {
    const org = getGitHubEnv().GITHUB_ORG ?? "1024XEngineer";
    const repos = await fetchOrgRepos(org);
    const result = await bulkUpsertOrgRepos(repos);
    return NextResponse.json({ message: `新增 ${result.added}，更新 ${result.updated}`, ...result });
  }

  if (action === "monitor" && githubRepo) {
    await enableMonitoring(githubRepo);
    return NextResponse.json({ success: true });
  }

  if (action === "unmonitor" && githubRepo) {
    await disableMonitoring(githubRepo);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ message: "无效 action" }, { status: 400 });
}
