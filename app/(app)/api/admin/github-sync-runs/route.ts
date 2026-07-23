import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { describeSyncFailure, runGitHubSync } from "@/lib/github-sync";

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
