import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { importOrgFromYaml } from "@/lib/database";
import { getWatchConfig } from "@/lib/watch-config";

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const config = await getWatchConfig();
  const result = await importOrgFromYaml(config.groups.map((g) => ({
    githubRepo: (() => {
      if (!g.github_repo) return "";
      const u = new URL(g.github_repo);
      const [o, n] = u.pathname.split("/").filter(Boolean);
      return `${o}/${n.replace(/\.git$/, "")}`;
    })(),
    mentor: g.mentor,
    assistant: g.assistant,
    members: g.members,
  })));
  return NextResponse.json({ message: `${result.repos} 仓库，${result.people} 人`, ...result });
}
