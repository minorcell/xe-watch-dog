# Watchdog

面向 GitHub 组织的数据分析与实训管理平台。帮助组织管理者从 GitHub 拉取仓库数据、追踪趋势、分析团队。

部署到 [Vercel](https://vercel.com) + [Neon](https://neon.tech)，零服务器运维。

## 功能

### 已实现

- **Star 看板** — 趋势图表 + 排行榜，时间范围切换、搜索、可见性筛选、CSV 导出
- **监控管理** — 实时同步组织仓库列表，按需开关仓库监控
- **调度引擎** — 可扩展的任务队列，元信息同步、快照采集独立开关控制
- **管理员认证** — bcrypt 密码 + JWT HttpOnly Cookie

### 规划中

- 成员活跃度分析（commits、PRs、reviews）
- 团队协作报告
- 自定义数据看板

## 部署

### 1. 数据库

在 [Neon](https://neon.tech) 创建 Postgres 项目，在 SQL Editor 中执行 `database/001_schema.sql`。

或者直接启动应用，代码会在首次访问时自动建表。

### 2. 环境变量

```env
# 必填
AUTH_SECRET=           # JWT 签名密钥，至少 32 字符（pnpm auth:secret 生成）
ADMIN_PASSWORD_HASH=   # bcrypt 密码哈希（pnpm auth:hash 生成）
GITHUB_TOKEN=ghp_xxx   # GitHub Personal Access Token
DATABASE_URL=postgres://...  # Neon 连接字符串
CRON_SECRET=           # Cron 端点 Bearer 密钥，至少 24 字符

# 可选
GITHUB_ORG=            # 监控的 GitHub 组织名
```

### 3. 部署到 Vercel

推送代码到 GitHub，在 Vercel 中导入项目，填入上述环境变量。

### 4. 首次使用

1. 部署完成后访问网站，使用管理员密码登录
2. 进入「系统设置」→「监控仓库」→ 点击「从 GitHub 刷新」
3. 对需要追踪的仓库打开监控开关
4. 回到 Star 看板，点击「获取最新快照」

Vercel Cron 会每天自动执行一次调度任务（`vercel.json` 中配置）。

## 自托管

在任意 Linux 服务器上运行。需要 Node 22+、pnpm、Postgres 16+。

```bash
pnpm install
pnpm build
pnpm start   # 默认端口 3000
```

Cron 替代方案：用系统 `crontab` 定时请求 `/api/cron/stars`：

```
0 1 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/stars
```

## Docker

```bash
# 1. 配置环境变量
cp .env.docker .env.docker.local
# 编辑 .env.docker.local 填入 AUTH_SECRET, ADMIN_PASSWORD_HASH, GITHUB_TOKEN, GITHUB_ORG, CRON_SECRET

# 2. 启动
docker compose up -d

# 3. 初始化数据库
docker compose exec app node -e "require('./server.js')" # schema auto-created on first request
# 或者手动：docker compose exec db psql -U watchdog -f database/001_schema.sql
```

访问 `http://localhost:3000`。

Cron 任务：在宿主机 crontab 中配置 curl 请求，或使用 [ofelia](https://github.com/mcuadros/ofelia) 等 Docker 调度器。

## 本地开发

```bash
pnpm install
pnpm auth:secret          # 生成 AUTH_SECRET
pnpm auth:hash -- "pwd"   # 生成密码哈希
# 创建 .env.local 填入环境变量
pnpm dev
```

## 技术栈

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Neon Postgres · Recharts · TanStack Table · Vercel Cron

## License

MIT
