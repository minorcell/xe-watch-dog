import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { describeSyncFailure, runGitHubSync } from "@/lib/github-sync";

export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) return NextResponse.json({ message: "CRON_SECRET 未配置" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }

  try {
    const run = await runGitHubSync("vercel-cron");
    console.log("[cron]", JSON.stringify({ runId: run.id, status: run.status }));
    return NextResponse.json(run);
  } catch (error) {
    const failure = describeSyncFailure(error);
    console.error("[cron] GitHub sync failed", error);
    return NextResponse.json(
      { code: failure.code, message: failure.message },
      { status: failure.httpStatus },
    );
  }
}
