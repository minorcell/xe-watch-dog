"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) { setError("请输入管理员密码"); return; }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) { setError(result.message ?? "登录失败"); return; }
      router.replace("/dashboard");
      router.refresh();
    } catch { setError("无法连接登录服务"); }
    finally { setIsSubmitting(false); }
  }

  function handleClose() {
    setPassword(""); setError(""); onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-label="关闭"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-xl border bg-card p-6 shadow-[0_24px_80px_rgb(0_0_0/20%)]"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold">管理员登录</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">输入密码进入看板</p>
              </div>
              <button type="button" onClick={handleClose} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-3.5" /></button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-2">
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="输入管理员密码"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                    autoComplete="current-password"
                    required
                    autoFocus
                    className="flex h-10 w-full rounded-lg border bg-transparent pl-9 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-foreground/20 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button type="button" onClick={() => setIsPasswordVisible((c) => !c)} className="absolute right-0 top-0 grid size-10 place-items-center rounded-r-lg text-muted-foreground hover:text-foreground" aria-label={isPasswordVisible ? "隐藏密码" : "显示密码"}>
                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {error ? <p className="text-[11px] text-destructive" role="alert">{error}</p> : <p className="text-[11px] text-muted-foreground">仅限项目管理员访问</p>}
              </div>
              <button type="submit" disabled={isSubmitting || !password} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40">
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {isSubmitting ? "正在验证" : "登录"}
              </button>
            </form>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3" />
              受保护的管理员空间
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
