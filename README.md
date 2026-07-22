# Watchdog

面向 `1024XEngineer` GitHub 仓库的管理看板。项目使用 Next.js App Router，前后端统一部署到 Vercel。

当前一期包含：

- shadcn/ui 兼容的组件与设计 token
- `app/data/info.yaml` 的服务端解析和 Zod 校验
- 管理员密码登录
- 签名的 HttpOnly 会话 Cookie
- 受保护的 Dashboard 外壳
- 基于 Neon 快照的 Star 趋势、排行榜、仓库可见性筛选和 CSV 导出
- 管理员手动获取最新快照和每日 Cron 采集入口

Dashboard 只读取 Neon 中的快照，不会在普通页面查询时调用 GitHub。首次使用时需配置数据库并点击“获取最新快照”。

## 本地启动

安装依赖：

```bash
pnpm install
```

创建 `.env.local`，内容参考 `.env.example`。

生成管理员密码哈希：

```bash
pnpm auth:hash -- "your-password"
```

Next.js 会展开本地环境文件中的 `$变量`。本地配置推荐直接生成 Base64 形式，避免 bcrypt 哈希中的 `$` 被展开：

```bash
pnpm auth:hash-b64 -- "your-password"
```

```env
ADMIN_PASSWORD_HASH_B64=...
```

可以保留 `ADMIN_PASSWORD_HASH` 作为 Vercel 控制台的原始 bcrypt 哈希写法；如果同时存在 Base64 版本，应用优先使用 Base64 版本。Vercel 控制台配置原始哈希时不需要添加反斜杠。

生成会话签名密钥：

```bash
pnpm auth:secret
```

将生成结果分别填入 `ADMIN_PASSWORD_HASH` 和 `AUTH_SECRET`，然后启动：

```bash
pnpm dev
```

访问 `http://localhost:3000`。

## 环境变量

| 名称 | 用途 |
| --- | --- |
| `ADMIN_PASSWORD_HASH` | bcrypt 格式的管理员密码哈希 |
| `AUTH_SECRET` | 会话 Cookie 的签名密钥，至少 32 个字符 |
| `GITHUB_TOKEN` | GitHub API Token，仅允许服务端读取 |
| `DATABASE_URL` | Neon Postgres 连接字符串，用于保存 Star 快照 |
| `CRON_SECRET` | 定时采集接口的 Bearer 密钥 |

## 配置文件

仓库观察范围由 `app/data/info.yaml` 定义。应用只把非空且格式正确的 `github_repo` 字段加入观察列表，空仓库记录会保留在配置摘要中，但不会进入后续采集任务。

Vercel 构建通过 `outputFileTracingIncludes` 将 YAML 配置包含在服务端函数中。

## Star 快照

将 `database/002_create_timestamped_star_snapshots.sql` 在 Neon SQL Editor 中执行一次，或直接进入 Dashboard 点击“获取最新快照”，应用会自动创建 `snapshot_runs` 和 `repository_star_snapshots`。每次采集均以带时区的时间戳保存，页面按北京时间展示。Vercel Cron 每天 01:00（UTC）请求 `/api/cron/stars`。

手动采集接口为 `POST /api/stars/snapshot`，只接受已登录管理员请求。定时接口要求 `Authorization: Bearer $CRON_SECRET`。

## 检查

```bash
pnpm lint
pnpm build
pnpm peers check
```
