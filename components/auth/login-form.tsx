"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) {
      setError("请输入管理员密码");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "登录失败，请稍后重试");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("无法连接登录服务");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-2.5">
        <label htmlFor="password" className="text-sm font-medium">
          管理员密码
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="输入管理员密码"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : "password-hint"}
            className="pl-10 pr-12"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute right-0 top-0 grid size-11 place-items-center rounded-r-lg text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            aria-label={isPasswordVisible ? "隐藏密码" : "显示密码"}
            aria-pressed={isPasswordVisible}
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error ? (
          <p id="password-error" className="text-sm text-destructive" role="alert">{error}</p>
        ) : (
          <p id="password-hint" className="text-xs text-muted-foreground">仅限项目管理员访问</p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting || !password} className="w-full shadow-[0_10px_24px_rgb(37_99_235/18%)]">
        {isSubmitting ? <LoaderCircle className="animate-spin" /> : null}
        {isSubmitting ? "正在验证" : "登录"}
      </Button>
    </form>
  );
}
