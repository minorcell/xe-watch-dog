import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getLatestSyncRun } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ code: "unauthorized", message: "未登录" }, { status: 401 });
  }

  return NextResponse.json({
    run: await getLatestSyncRun(),
    mode: process.env.VERCEL_ENV ? "vercel" : "self-hosted",
    schedule: process.env.VERCEL_ENV ? "0 1 * * *" : (process.env.CRON_SCHEDULE ?? "0 1 * * *"),
    timezone: "UTC",
  });
}
