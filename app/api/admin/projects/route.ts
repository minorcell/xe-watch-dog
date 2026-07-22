import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ message: "获取项目列表失败", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const body = await request.json();
    const { name, topic } = body;
    if (!name?.trim()) return NextResponse.json({ message: "项目名称不能为空" }, { status: 400 });
    const project = await createProject(name.trim(), (topic ?? "").trim());
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "创建项目失败", error: String(error) }, { status: 500 });
  }
}
