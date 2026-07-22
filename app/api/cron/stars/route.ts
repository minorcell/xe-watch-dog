import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { collectStarSnapshots } from "@/lib/stars";

export async function GET(request: Request) {
  const cronSecret = getCronSecret();

  if (!cronSecret) {
    return NextResponse.json({ message: "CRON_SECRET 尚未配置" }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const result = await collectStarSnapshots();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scheduled Star snapshot failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Star 快照采集失败" },
      { status: 503 },
    );
  }
}
