import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { deletePerson, updatePerson } from "@/lib/database";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, githubId } = body;
    if (!name?.trim()) return NextResponse.json({ message: "姓名不能为空" }, { status: 400 });
    const person = await updatePerson(Number(id), name.trim(), (githubId ?? "").trim());
    if (!person) return NextResponse.json({ message: "人员不存在" }, { status: 404 });
    return NextResponse.json(person);
  } catch (error) {
    return NextResponse.json({ message: "更新人员失败", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ message: "未登录" }, { status: 401 });
  try {
    const { id } = await params;
    const ok = await deletePerson(Number(id));
    if (!ok) return NextResponse.json({ message: "人员不存在或有关联数据" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "删除人员失败", error: String(error) }, { status: 500 });
  }
}
