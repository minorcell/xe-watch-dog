import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getLastRun } from "@/lib/scheduler-tasks";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const record = getLastRun();
  // Include deployment mode indicator
  return NextResponse.json(record ? { ...record, mode: process.env.VERCEL ? "vercel" : "self-hosted" } : null);
}
