import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGroupDetailByRepo } from "@/lib/database";

export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const repo = request.nextUrl.searchParams.get("repo");
    if (!repo) return NextResponse.json({ message: "缺少 repo 参数" }, { status: 400 });
    const group = await getGroupDetailByRepo(repo);
    if (!group) return NextResponse.json({ message: "未找到该仓库对应的组织信息" }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ message: "获取详情失败", error: String(error) }, { status: 500 });
  }
}
