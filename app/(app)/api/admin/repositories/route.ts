import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { listRepositories } from "@/lib/database";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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

  return NextResponse.json(await listRepositories(input.data));
}
