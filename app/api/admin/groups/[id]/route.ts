import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { deleteGroup, updateGroup } from "@/lib/database";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { projectId, mentorId, assistantId, githubRepo, githubTeam, memberIds } = body;
    if (!projectId || !mentorId || !assistantId || !githubRepo?.trim()) {
      return NextResponse.json({ message: "项目、导师、助教和仓库为必填项" }, { status: 400 });
    }
    const group = await updateGroup(Number(id), {
      projectId: Number(projectId),
      mentorId: Number(mentorId),
      assistantId: Number(assistantId),
      githubRepo: githubRepo.trim(),
      githubTeam: (githubTeam ?? "").trim(),
      memberIds: (memberIds ?? []).map(Number),
    });
    if (!group) return NextResponse.json({ message: "小组不存在" }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ message: "更新小组失败", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const ok = await deleteGroup(Number(id));
    if (!ok) return NextResponse.json({ message: "小组不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "删除小组失败", error: String(error) }, { status: 500 });
  }
}
