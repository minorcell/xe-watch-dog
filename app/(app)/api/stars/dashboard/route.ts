import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { resolveDateRange } from "@/lib/date-range";
import { getStarDashboardData } from "@/lib/stars";

export async function GET(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const range = resolveDateRange({
    preset: searchParams.get("preset") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  const data = await getStarDashboardData(range);
  return NextResponse.json(data);
}
