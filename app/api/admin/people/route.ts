import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { deletePerson, listPeople, upsertPerson } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  return NextResponse.json(await listPeople());
}

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const { githubId, realName } = await request.json();
  if (!githubId?.trim()) return NextResponse.json({ message: "GitHub ID 不能为空" }, { status: 400 });
  const person = await upsertPerson(githubId.trim(), realName?.trim() || undefined);
  return NextResponse.json(person, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const githubId = request.nextUrl.searchParams.get("githubId");
  if (!githubId) return NextResponse.json({ message: "缺少 githubId" }, { status: 400 });
  const ok = await deletePerson(githubId);
  if (!ok) return NextResponse.json({ message: "人员不存在" }, { status: 404 });
  return NextResponse.json({ success: true });
}
