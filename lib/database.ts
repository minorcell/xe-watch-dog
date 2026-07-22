import { neon } from "@neondatabase/serverless";
import { z } from "zod";

import { getDatabaseUrl } from "@/lib/env";
import type { RepositoryStarStats } from "@/lib/github";

const timestampSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString() : value,
  z.string().min(1),
);

const nullableTimestampSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString() : value,
  z.string().min(1).nullable(),
);

const snapshotRowSchema = z.object({
  runId: z.coerce.number().int(),
  repository: z.string(),
  projectName: z.string(),
  topic: z.string(),
  url: z.url(),
  visibility: z.enum(["public", "private", "unknown"]),
  capturedAt: timestampSchema,
  stars: z.coerce.number().int().nonnegative(),
  forks: z.coerce.number().int().nonnegative(),
  openIssues: z.coerce.number().int().nonnegative(),
  updatedAt: nullableTimestampSchema,
});

const snapshotRunSchema = z.object({
  id: z.coerce.number().int(),
  capturedAt: timestampSchema,
  status: z.enum(["completed", "partial", "failed"]),
  successCount: z.coerce.number().int().nonnegative(),
  failureCount: z.coerce.number().int().nonnegative(),
});

export type StarSnapshot = z.infer<typeof snapshotRowSchema>;
export type SnapshotRun = z.infer<typeof snapshotRunSchema>;

function getSql() {
  const databaseUrl = getDatabaseUrl();
  return databaseUrl ? neon(databaseUrl) : null;
}

export function isDatabaseConfigured() {
  return getDatabaseUrl() !== null;
}

export async function ensureSnapshotSchema() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");

  await sql`
    CREATE TABLE IF NOT EXISTS snapshot_runs (
      id BIGSERIAL PRIMARY KEY,
      captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
      success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
      failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS repository_star_snapshots (
      run_id BIGINT NOT NULL REFERENCES snapshot_runs(id) ON DELETE CASCADE,
      repository TEXT NOT NULL,
      project_name TEXT NOT NULL,
      topic TEXT NOT NULL,
      url TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'unknown' CHECK (visibility IN ('public', 'private', 'unknown')),
      captured_at TIMESTAMPTZ NOT NULL,
      stars INTEGER NOT NULL CHECK (stars >= 0),
      forks INTEGER NOT NULL CHECK (forks >= 0),
      open_issues INTEGER NOT NULL CHECK (open_issues >= 0),
      updated_at TIMESTAMPTZ,
      PRIMARY KEY (run_id, repository)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS repository_star_snapshots_repository_captured_idx
    ON repository_star_snapshots (repository, captured_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS repository_star_snapshots_captured_idx
    ON repository_star_snapshots (captured_at DESC)
  `;
}

export async function saveStarSnapshots(stats: RepositoryStarStats[], failureCount = 0) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");

  await ensureSnapshotSchema();

  const status = stats.length === 0 ? "failed" : failureCount > 0 ? "partial" : "completed";
  const [run] = await sql`
    INSERT INTO snapshot_runs (status, success_count, failure_count)
    VALUES (${status}, ${stats.length}, ${failureCount})
    RETURNING id, captured_at AS "capturedAt"
  `;

  if (!run) throw new Error("无法创建快照批次");

  await Promise.all(stats.map((repository) => sql`
    INSERT INTO repository_star_snapshots (
      run_id, repository, project_name, topic, url, visibility,
      captured_at, stars, forks, open_issues, updated_at
    )
    VALUES (
      ${run.id}, ${repository.fullName}, ${repository.projectName}, ${repository.topic},
      ${repository.url}, ${repository.visibility}, ${run.capturedAt}, ${repository.stars},
      ${repository.forks}, ${repository.openIssues}, ${repository.updatedAt}
    )
  `));

  return {
    runId: Number(run.id),
    capturedAt: String(run.capturedAt),
  };
}

export async function getStarSnapshots(from: string, to: string): Promise<StarSnapshot[]> {
  const sql = getSql();
  if (!sql) return [];

  await ensureSnapshotSchema();

  const rows = await sql`
    SELECT
      run_id AS "runId",
      repository,
      project_name AS "projectName",
      topic,
      url,
      visibility,
      captured_at AS "capturedAt",
      stars,
      forks,
      open_issues AS "openIssues",
      updated_at AS "updatedAt"
    FROM repository_star_snapshots
    WHERE captured_at >= (${from}::date AT TIME ZONE 'Asia/Shanghai')
      AND captured_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'Asia/Shanghai')
    ORDER BY captured_at ASC, repository ASC
  `;

  return z.array(snapshotRowSchema).parse(rows);
}

export async function getLatestStarSnapshots(): Promise<StarSnapshot[]> {
  const sql = getSql();
  if (!sql) return [];

  await ensureSnapshotSchema();

  const rows = await sql`
    SELECT DISTINCT ON (repository)
      run_id AS "runId",
      repository,
      project_name AS "projectName",
      topic,
      url,
      visibility,
      captured_at AS "capturedAt",
      stars,
      forks,
      open_issues AS "openIssues",
      updated_at AS "updatedAt"
    FROM repository_star_snapshots
    ORDER BY repository, captured_at DESC
  `;

  return z.array(snapshotRowSchema).parse(rows);
}

// ── Organization schema ───────────────────────────────────────

export async function ensureOrganizationSchema() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");

  await sql`
    CREATE TABLE IF NOT EXISTS repos (
      github_repo TEXT PRIMARY KEY,
      monitoring_enabled BOOLEAN NOT NULL DEFAULT false,
      description TEXT,
      homepage_url TEXT,
      topics TEXT[] DEFAULT '{}',
      language TEXT,
      visibility TEXT NOT NULL DEFAULT 'unknown',
      archived BOOLEAN NOT NULL DEFAULT false,
      synced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scheduler_tasks (
      name TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT true,
      description TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Seed tasks
  await sql`
    INSERT INTO scheduler_tasks (name, enabled, description) VALUES
      ('sync-org-repos', true, '从 GitHub 同步组织下全量仓库列表'),
      ('sync-repo-metadata', true, '同步监控中仓库的详细元信息'),
      ('collect-star-snapshots', true, '采集监控中仓库的 Star 快照')
    ON CONFLICT (name) DO NOTHING
  `;
}

// ── Types ─────────────────────────────────────────────────────

export type Repo = {
  githubRepo: string;
  monitoringEnabled: boolean;
  description: string | null;
  homepageUrl: string | null;
  topics: string[];
  language: string | null;
  visibility: string;
  archived: boolean;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SchedulerTask = {
  name: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
};

// Scheduler ────────────────────────────────────────────────────

export async function listSchedulerTasks(): Promise<SchedulerTask[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();
  const rows = await sql`SELECT name, enabled, description, updated_at AS "updatedAt" FROM scheduler_tasks ORDER BY name`;
  return rows as SchedulerTask[];
}

export async function setSchedulerTask(name: string, enabled: boolean): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();
  await sql`UPDATE scheduler_tasks SET enabled = ${enabled}, updated_at = NOW() WHERE name = ${name}`;
}

export async function getEnabledTaskNames(): Promise<string[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();
  const rows = await sql`SELECT name FROM scheduler_tasks WHERE enabled = true`;
  return (rows as { name: string }[]).map((r) => r.name);
}

// Repos ────────────────────────────────────────────────────────

export async function listRepos(opts?: { monitoringEnabled?: boolean }): Promise<Repo[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();
  const filter = opts?.monitoringEnabled !== undefined
    ? sql`WHERE monitoring_enabled = ${opts.monitoringEnabled}`
    : sql``;
  const rows = await sql`
    SELECT github_repo AS "githubRepo", monitoring_enabled AS "monitoringEnabled",
           description, homepage_url AS "homepageUrl", topics, language,
           visibility, archived, synced_at AS "syncedAt",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM repos ${filter} ORDER BY github_repo
  `;
  return (rows as Repo[]).map((r) => ({ ...r, topics: r.topics ?? [] }));
}

export async function enableMonitoring(githubRepo: string): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();
  await sql`INSERT INTO repos (github_repo, monitoring_enabled) VALUES (${githubRepo}, true) ON CONFLICT (github_repo) DO UPDATE SET monitoring_enabled = true`;
}

export async function disableMonitoring(githubRepo: string): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();
  await sql`DELETE FROM repos WHERE github_repo = ${githubRepo}`;
}

export async function bulkUpsertOrgRepos(repos: Array<{
  githubRepo: string; description: string | null; homepageUrl: string | null;
  topics: string[]; language: string | null; visibility: string; archived: boolean;
}>): Promise<{ added: number; updated: number }> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();
  let added = 0, updated = 0;
  for (const r of repos) {
    const [e] = await sql`SELECT github_repo FROM repos WHERE github_repo = ${r.githubRepo}`;
    if (e) {
      updated++;
      await sql`UPDATE repos SET description=${r.description}, homepage_url=${r.homepageUrl}, topics=${r.topics}, language=${r.language}, visibility=${r.visibility}, archived=${r.archived}, synced_at=NOW() WHERE github_repo=${r.githubRepo}`;
    } else {
      added++;
      await sql`INSERT INTO repos (github_repo, monitoring_enabled, description, homepage_url, topics, language, visibility, archived) VALUES (${r.githubRepo}, false, ${r.description}, ${r.homepageUrl}, ${r.topics}, ${r.language}, ${r.visibility}, ${r.archived})`;
    }
  }
  return { added, updated };
}

export async function syncRepoMetadata(githubRepo: string, metadata: {
  description: string | null; homepageUrl: string | null; topics: string[];
  language: string | null; visibility: string; archived: boolean;
}): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();
  await sql`UPDATE repos SET description=${metadata.description}, homepage_url=${metadata.homepageUrl}, topics=${metadata.topics}, language=${metadata.language}, visibility=${metadata.visibility}, archived=${metadata.archived}, synced_at=NOW() WHERE github_repo=${githubRepo}`;
}

export async function getMonitoredRepos(): Promise<string[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();
  const rows = await sql`SELECT github_repo AS "githubRepo" FROM repos WHERE monitoring_enabled = true ORDER BY github_repo`;
  return (rows as { githubRepo: string }[]).map((r) => r.githubRepo);
}

export async function isOrgDataAvailable(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureOrganizationSchema();
  const [row] = await sql`SELECT COUNT(*)::int AS count FROM repos`;
  return (row?.count ?? 0) > 0;
}

export async function getLatestSnapshotRun(): Promise<SnapshotRun | null> {
  const sql = getSql();
  if (!sql) return null;

  await ensureSnapshotSchema();

  const [row] = await sql`
    SELECT
      id,
      captured_at AS "capturedAt",
      status,
      success_count AS "successCount",
      failure_count AS "failureCount"
    FROM snapshot_runs
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  return row ? snapshotRunSchema.parse(row) : null;
}
