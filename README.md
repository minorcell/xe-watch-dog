# Watchdog

面向 GitHub 组织的数据分析平台。帮助管理者从 GitHub 拉取仓库数据、分析团队指标。

部署到 Vercel + Neon，零服务器运维。

## 功能

- **Star 看板** — 趋势图表 + 排行榜，时间范围切换、搜索、可见性筛选、CSV 导出
- **监控管理** — 实时同步组织仓库列表，按需开关监控
- **原子同步** — 仓库目录、监控指标和运行状态在一次 GitHub 同步中提交
- **管理员认证** — bcrypt + JWT HttpOnly Cookie

## 快速开始

```bash
pnpm install
pnpm auth:secret
pnpm auth:hash -- "your-password"
cp .env.example .env.local   # 编辑填入环境变量
pnpm db:migrate              # 应用版本化数据库迁移
pnpm dev                     # http://localhost:3000
```

## 部署

- [Vercel + Neon](docs/deployment.md#方案-avercel--neon推荐)
- [自托管](docs/deployment.md#方案-b自托管)
- [Docker](docs/deployment.md#方案-cdocker)

## 技术栈

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Neon Postgres · Recharts · TanStack Table · Vercel Cron

## License

MIT
