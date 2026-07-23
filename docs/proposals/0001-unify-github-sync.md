# Proposal: 统一 GitHub 仓库同步与指标采集

- 状态：Implemented
- 日期：2026-07-23
- 范围：API、调度、数据库 schema、GitHub 数据同步边界

## 1. 决策

Watchdog 仍处于项目早期，不保留旧数据库兼容层。现有数据库直接清空并以新 schema 重建；旧仓库设置、历史批次和历史快照不回填。

系统只保留一个 `github-sync` job：一次完整拉取 GitHub organization 仓库列表，在一个数据库事务中更新仓库目录、写入已监控仓库的 Star/Fork 指标，并完成运行记录。手动操作、Vercel Cron 和内置 Cron 只是三个触发适配器。

## 2. 原问题

- `/api/stars/snapshot` 实际执行所有已启用 task，API 名称与副作用不一致；
- organization 列表已经包含元信息和指标，旧实现仍逐仓库重复请求；
- `scheduler_tasks` 与代码 task 列表形成两个注册中心；
- `scheduler_runs` 在 SQL、runtime DDL 和远程数据库中的列定义不同；
- 快照批次与明细分步提交，失败时可能留下部分数据；
- `owner/name` 被当作主键，rename 或 transfer 会切断历史；
- 关闭监控通过删除仓库实现，混淆目录成员关系与监控设置；
- Docker 忽略 schema 失败，部署日志不能证明数据库可用。

## 3. 目标模型

### 3.1 仓库身份

`repositories.github_id` 是唯一身份；`full_name` 是可变展示和定位信息。同步时按 `github_id` upsert，因此 rename/transfer 不改变监控设置和历史关联。

未出现在一次完整 GitHub 响应中的仓库设置 `unavailable_at`，不硬删除；重新出现时清空该字段。

### 3.2 同步作业

一次同步严格执行：

1. 创建带 30 分钟 lease 的 `github_sync_runs`；
2. 分页拉取并校验完整 organization 仓库列表；
3. 在单一事务中 reconcile `repositories`；
4. 为 `monitoring_enabled = true` 且当前可见的仓库写入指标；
5. 将运行更新为 `completed`。

数据库部分唯一索引保证全局最多一个 `running` 作业。过期 lease 会先标记失败；GitHub 请求或响应校验失败时，只记录失败运行，不改仓库目录和指标。

### 3.3 数据表

- `repositories`：GitHub 仓库目录、稳定身份、监控设置和可用状态；
- `github_sync_runs`：统一运行状态、触发来源、lease、计数和错误；
- `repository_metric_snapshots`：每次运行中已监控仓库的 Star/Fork 指标；
- `schema_migrations`：migration 版本、时间和 checksum。

不再存储可从仓库目录或运行记录推导出的 `project_name`、`topic`、快照 URL、重复时间和空 scheduler results。

## 4. API

| 方法与路径 | 语义 |
|---|---|
| `GET /api/admin/repositories` | SQL 分页读取仓库目录 |
| `GET /api/admin/repositories/:githubId` | 按稳定 ID 读取仓库 |
| `PATCH /api/admin/repositories/:githubId` | 只更新监控布尔值 |
| `POST /api/admin/github-sync-runs` | 手动触发统一同步 |
| `GET /api/admin/github-sync-runs/latest` | 读取最近运行与调度配置 |
| `GET /api/cron/run` | Vercel Cron 触发统一同步 |
| `GET /api/stars/dashboard` | 读取新表形成的看板 read model |

非法 path/query/body 返回结构化 `400`，不存在仓库返回 `404`，并发同步返回 `409`。

## 5. 调度

不再提供通用 task runner、task 依赖或数据库 task 开关。三个触发入口全部调用 `runGitHubSync()`：

- Vercel 使用 `vercel.json` 的 UTC cron；
- 自托管和 Docker 使用 `node-cron`，固定 UTC 且启用 `noOverlap`；
- 管理员按钮触发 `manual` 运行。

进程内 `noOverlap` 只减少本地重入，数据库唯一索引才是跨实例并发控制。

## 6. Schema 与部署

`database/migrations/` 是唯一 schema 权威。应用请求和启动代码不执行临时 DDL；migration runner 记录 checksum，已应用文件发生修改时失败。

新数据库执行：

```bash
pnpm db:migrate
```

Docker 在应用启动前执行同一个 runner，迁移失败时容器退出。旧版升级不执行 backfill：停止旧应用和调度，清空或新建数据库，执行 migration，部署新应用，再运行一次同步。

## 7. 看板语义

最近一次运行状态与各仓库最后成功指标分开表达：

- `current`：仓库指标来自最近成功运行；
- `stale`：仓库有旧指标，但最近成功运行没有该仓库；
- `never`：仓库从未产生指标；
- `unavailable_at`：最近完整 GitHub 列表中不可见。

关闭监控只更新 `monitoring_enabled`，仓库目录和既有历史不删除。

## 8. 验收标准

- 一次成功运行只调用 organization 仓库列表 API，不发送逐仓库请求；
- GitHub 分页、鉴权或响应校验失败时目录和指标不变；
- 两个并发触发最多产生一个 running/completed 作业；
- rename 保持 `github_id`、监控设置和历史连续；
- 同步最终写入具备事务原子性；
- 新环境只包含四个目标表，不出现旧 task/snapshot 表；
- 管理界面没有 task 开关、删除即关闭监控或旧 API 调用；
- lint、单元测试、类型检查和生产构建通过。

## 9. 非目标

- 不迁移旧仓库开关和历史快照；
- 不保留旧 API 兼容别名；
- 不引入 webhook、队列系统或通用工作流引擎；
- 不提供 destructive reset 命令作为常规运维接口。
