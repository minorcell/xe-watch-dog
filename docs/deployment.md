# 部署指南

## 方案 A：Vercel + Neon（推荐）

适合大多数场景，零运维。

### 数据库

1. [Neon](https://neon.tech) 创建 Postgres 项目
2. 复制连接字符串并写入本地 `.env.local`
3. 执行 `pnpm db:migrate`

数据库结构只由 `database/migrations/` 中的版本化 migration 管理，应用请求不会自动建表。

当前 schema 只支持全新数据库，不包含旧表或历史数据兼容逻辑。早期版本升级时请创建空数据库，再执行 migration。

### 环境变量

```env
# 必填
AUTH_SECRET=              # pnpm auth:secret
ADMIN_PASSWORD_HASH=      # pnpm auth:hash -- "your-password"
GITHUB_TOKEN=ghp_xxx
GITHUB_ORG=
DATABASE_URL=postgres://...
CRON_SECRET=              # 任意随机字符串，≥ 24 字符
```

### 部署

推送代码到 GitHub，在 Vercel 导入项目，填入环境变量。Vercel Cron 自动按 `vercel.json` 配置（每天 1:00 UTC）触发同一个 GitHub 同步作业。

---

## 方案 B：自托管

需要 Node 22+、pnpm、Postgres 16+。

```bash
pnpm install
pnpm db:migrate
pnpm build
pnpm start   # 默认端口 3000
```

调度器：应用启动时自动激活内置 `node-cron`，无需额外配置。

自定义调度频率：

```env
CRON_SCHEDULE=0 */6 * * *   # 每 6 小时
```

---

## 方案 C：Docker

```bash
cp .env.example .env.docker
# 编辑 .env.docker，并设置：
# DATABASE_URL=postgres://watchdog:watchdog@db:5432/watchdog
docker compose up -d
```

内部包含 `app` + `postgres:16`，数据卷 `pgdata` 持久化。应用容器启动时会先执行版本化 migration。

调度器：容器启动后自动运行，无需外部 crontab。

自定义调度频率：在 `.env.docker.local` 中设置 `CRON_SCHEDULE`。

---

## 调度机制

三套方案使用同一套调度逻辑：

```
触发方式                               适用方案
─────────                              ────────
Vercel Cron → /api/cron/run            Vercel
内置 node-cron                         自托管 / Docker
管理端按钮 → /api/admin/github-sync-runs 所有方案
```

所有入口都调用同一个 `github-sync` 作业。该作业只拉取一次 GitHub organization 仓库列表，并在一个事务中更新仓库目录、写入已监控仓库指标和完成运行记录。同一时刻最多允许一个同步运行。

## 登录凭证

```bash
pnpm auth:secret              # 生成 AUTH_SECRET
pnpm auth:hash -- "密码"      # 生成 ADMIN_PASSWORD_HASH
```
