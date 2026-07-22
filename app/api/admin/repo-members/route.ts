import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { removeRepoMember, setRepoMember } from "@/lib/database";

// PUT { githubRepo, members: [{ githubId, role }] }
export async function PUT(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const { githubRepo, members } = await request.json();
  if (!githubRepo) return NextResponse.json({ message: "缺少 githubRepo" }, { status: 400 });

  // Replace all members
  if (Array.isArray(members)) {
    for (const m of members) {
      if (m.githubId && m.role) {
        await setRepoMember(githubRepo, m.githubId, m.role);
      }
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE ?githubRepo=xxx&githubId=yyy
export async function DELETE(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const githubRepo = request.nextUrl.searchParams.get("githubRepo");
  const githubId = request.nextUrl.searchParams.get("githubId");
  if (!githubRepo || !githubId) {
    return NextResponse.json({ message: "缺少 githubRepo 或 githubId" }, { status: 400 });
  }
  await removeRepoMember(githubRepo, githubId);
  return NextResponse.json({ success: true });
}
