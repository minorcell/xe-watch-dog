import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { getRepository, setRepositoryMonitoring } from "@/lib/database";

const pathSchema = z.coerce.number().int().positive();
const updateSchema = z.object({
  monitoringEnabled: z.boolean(),
}).strict();

type RouteContext = { params: Promise<{ githubId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!(await getSession())) {
    return NextResponse.json({ code: "unauthorized", message: "未登录" }, { status: 401 });
  }

  const githubId = pathSchema.safeParse((await context.params).githubId);
  if (!githubId.success) {
    return NextResponse.json({ code: "invalid_request", message: "仓库 ID 无效" }, { status: 400 });
  }

  const repository = await getRepository(githubId.data);
  if (!repository) {
    return NextResponse.json({ code: "repository_not_found", message: "仓库不存在" }, { status: 404 });
  }
  return NextResponse.json(repository);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await getSession())) {
    return NextResponse.json({ code: "unauthorized", message: "未登录" }, { status: 401 });
  }

  const githubId = pathSchema.safeParse((await context.params).githubId);
  const input = updateSchema.safeParse(await request.json().catch(() => null));
  if (!githubId.success || !input.success) {
    return NextResponse.json({ code: "invalid_request", message: "监控设置无效" }, { status: 400 });
  }

  const updated = await setRepositoryMonitoring(githubId.data, input.data.monitoringEnabled);
  if (!updated) {
    return NextResponse.json({ code: "repository_not_found", message: "仓库不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
