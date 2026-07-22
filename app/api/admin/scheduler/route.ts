import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { listSchedulerTasks, setSchedulerTask } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const tasks = await listSchedulerTasks();
  return NextResponse.json(tasks);
}

export async function PUT(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const { name, enabled } = await request.json();
  if (!name || typeof enabled !== "boolean") {
    return NextResponse.json({ message: "需要 name 和 enabled" }, { status: 400 });
  }
  await setSchedulerTask(name, enabled);
  return NextResponse.json({ success: true });
}
