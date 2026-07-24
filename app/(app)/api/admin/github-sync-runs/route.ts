import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { listSyncRuns } from "@/lib/database";
import { describeSyncFailure, runGitHubSync } from "@/lib/github-sync";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ code: "unauthorized", message: "未登录" }, { status: 401 });
  }

  const input = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!input.success) {
    return NextResponse.json(
      { code: "invalid_request", message: "分页参数无效", details: input.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json(await listSyncRuns(input.data));
}

export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ code: "unauthorized", message: "未登录" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runGitHubSync("manual"));
  } catch (error) {
    const failure = describeSyncFailure(error);
    console.error("Manual GitHub sync failed", error);
    return NextResponse.json(
      { code: failure.code, message: failure.message },
      { status: failure.httpStatus },
    );
  }
}
