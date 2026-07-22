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
    const all = await listRepos();
    const repo = all.find((r) => r.githubRepo === detail);
    if (!repo) return NextResponse.json({ message: "仓库不存在" }, { status: 404 });
    return NextResponse.json(repo);
  }

  const all = await listRepos();
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") ?? "20", 10)));
  const total = all.length;
  const monitoredCount = all.filter((r) => r.monitoringEnabled).length;
  const items = all.slice((page - 1) * pageSize, page * pageSize);
  return NextResponse.json({ items, total, monitoredCount, page, pageSize });
}

// POST { action: "sync" }  → trigger GitHub org sync
// POST { action: "monitor", githubRepo } → enable monitoring
// POST { action: "unmonitor", githubRepo } → disable monitoring
export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const body = await request.json();
  const { action, githubRepo } = body;

  if (action === "sync") {
    const org = getGitHubEnv().GITHUB_ORG;
    if (!org) return NextResponse.json({ message: "GITHUB_ORG 未配置" }, { status: 500 });
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
