import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { collectStarSnapshots } from "@/lib/stars";

export async function POST() {
  if (!(await getSession())) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const result = await collectStarSnapshots();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Manual Star snapshot failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Star 快照采集失败" },
      { status: 503 },
    );
  }
}
