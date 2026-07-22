import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { deleteProject, updateProject } from "@/lib/database";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, topic } = body;
    if (!name?.trim()) return NextResponse.json({ message: "项目名称不能为空" }, { status: 400 });
    const project = await updateProject(Number(id), name.trim(), (topic ?? "").trim());
    if (!project) return NextResponse.json({ message: "项目不存在" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ message: "更新项目失败", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const ok = await deleteProject(Number(id));
    if (!ok) return NextResponse.json({ message: "项目不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "删除项目失败", error: String(error) }, { status: 500 });
  }
}
