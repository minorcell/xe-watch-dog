import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getLastRun } from "@/lib/scheduler-tasks";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const record = await getLastRun();
  const mode = process.env.VERCEL_ENV ? "vercel" : "self-hosted";
  // Always return mode so the UI never defaults to the wrong scheduler type.
  return NextResponse.json(record ? { ...record, mode } : { mode });
}
