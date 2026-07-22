import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createGroup, listGroups } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const groups = await listGroups();
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ message: "获取小组列表失败", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const body = await request.json();
    const { projectId, mentorId, assistantId, githubRepo, githubTeam, memberIds } = body;
    if (!projectId || !mentorId || !assistantId || !githubRepo?.trim()) {
      return NextResponse.json({ message: "项目、导师、助教和仓库为必填项" }, { status: 400 });
    }
    const group = await createGroup({
      projectId: Number(projectId),
      mentorId: Number(mentorId),
      assistantId: Number(assistantId),
      githubRepo: githubRepo.trim(),
      githubTeam: (githubTeam ?? "").trim(),
      memberIds: (memberIds ?? []).map(Number),
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "创建小组失败", error: String(error) }, { status: 500 });
  }
}
