import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession } from "@/lib/auth";
import { getAuthEnv } from "@/lib/env";

const loginSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const input = loginSchema.safeParse(await request.json().catch(() => null));

  if (!input.success) {
    return NextResponse.json({ message: "请输入管理员密码" }, { status: 400 });
  }

  try {
    const isValid = await bcrypt.compare(input.data.password, getAuthEnv().ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return NextResponse.json({ message: "密码不正确" }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login configuration error", error);
    return NextResponse.json({ message: "登录服务尚未配置" }, { status: 503 });
  }
}
