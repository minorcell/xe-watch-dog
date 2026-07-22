import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createPerson, listPeople } from "@/lib/database";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const people = await listPeople();
    return NextResponse.json(people);
  } catch (error) {
    return NextResponse.json({ message: "获取人员列表失败", error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const body = await request.json();
    const { name, githubId } = body;
    if (!name?.trim()) return NextResponse.json({ message: "姓名不能为空" }, { status: 400 });
    const person = await createPerson(name.trim(), (githubId ?? "").trim());
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "创建人员失败", error: String(error) }, { status: 500 });
  }
}
