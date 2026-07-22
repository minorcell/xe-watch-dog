import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { importOrgFromYaml } from "@/lib/database";
import { getWatchConfig } from "@/lib/watch-config";

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const config = await getWatchConfig();
    const result = await importOrgFromYaml(config.groups.map((g) => ({
      projectName: g.project_name,
      topic: g.topic,
      mentor: g.mentor,
      assistant: g.assistant,
      githubRepo: g.github_repo,
      githubTeam: g.github_team,
      members: g.members,
    })));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: "导入失败", error: String(error) }, { status: 500 });
  }
}
