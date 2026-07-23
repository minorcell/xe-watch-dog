import { neon } from "@neondatabase/serverless";
import { z } from "zod";

import { getDatabaseUrl } from "@/lib/env";
import type { GitHubRepository } from "@/lib/github";

const timestampSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString() : value,
  z.string().min(1),
);

const nullableTimestampSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString() : value,
  z.string().min(1).nullable(),
);

const repositoryRowSchema = z.object({
  githubId: z.coerce.number().int().positive(),
  fullName: z.string(),
  htmlUrl: z.url(),
  description: z.string().nullable(),
  homepageUrl: z.string().nullable(),
  topics: z.array(z.string()).nullable().transform((value) => value ?? []),
  language: z.string().nullable(),
  visibility: z.enum(["public", "private", "internal"]),
  archived: z.boolean(),
  monitoringEnabled: z.boolean(),
  githubUpdatedAt: timestampSchema,
  pushedAt: nullableTimestampSchema,
  lastSeenAt: timestampSchema,
  unavailableAt: nullableTimestampSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const syncRunRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  trigger: z.enum(["manual", "vercel-cron", "internal-cron"]),
  status: z.enum(["running", "completed", "failed"]),
  startedAt: timestampSchema,
  leaseExpiresAt: nullableTimestampSchema,
  capturedAt: nullableTimestampSchema,
  finishedAt: nullableTimestampSchema,
  repositoryCount: z.coerce.number().int().nonnegative().nullable(),
  snapshotCount: z.coerce.number().int().nonnegative().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

const metricSnapshotRowSchema = z.object({
  runId: z.coerce.number().int().positive(),
  githubId: z.coerce.number().int().positive(),
  repository: z.string(),
  url: z.url(),
  visibility: z.enum(["public", "private", "internal"]),
  capturedAt: timestampSchema,
  stars: z.coerce.number().int().nonnegative(),
  forks: z.coerce.number().int().nonnegative(),
});

export type Repository = z.infer<typeof repositoryRowSchema>;
export type SyncRun = z.infer<typeof syncRunRowSchema>;
export type MetricSnapshot = z.infer<typeof metricSnapshotRowSchema>;
export type SyncTrigger = SyncRun["trigger"];

function getSql() {
  const databaseUrl = getDatabaseUrl();
  return databaseUrl ? neon(databaseUrl) : null;
}

function requireSql() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  return sql;
}

function repositoryColumns() {
  return `
    github_id AS "githubId",
    full_name AS "fullName",
    html_url AS "htmlUrl",
    description,
    homepage_url AS "homepageUrl",
    topics,
    language,
    visibility,
    archived,
    monitoring_enabled AS "monitoringEnabled",
    github_updated_at AS "githubUpdatedAt",
    pushed_at AS "pushedAt",
    last_seen_at AS "lastSeenAt",
    unavailable_at AS "unavailableAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;
}

function syncRunColumns() {
  return `
    id,
    trigger,
    status,
    started_at AS "startedAt",
    lease_expires_at AS "leaseExpiresAt",
    captured_at AS "capturedAt",
    finished_at AS "finishedAt",
    repository_count AS "repositoryCount",
    snapshot_count AS "snapshotCount",
    error_code AS "errorCode",
    error_message AS "errorMessage"
  `;
}

export function isDatabaseConfigured() {
  return getDatabaseUrl() !== null;
}

export async function listRepositories(input: { page: number; pageSize: number }) {
  const sql = requireSql();
  const offset = (input.page - 1) * input.pageSize;
  const [counts, rows] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE monitoring_enabled)::int AS "monitoredCount"
      FROM repositories
    `,
    sql.query(`
      SELECT ${repositoryColumns()}
      FROM repositories
      ORDER BY monitoring_enabled DESC, full_name ASC
      LIMIT $1 OFFSET $2
    `, [input.pageSize, offset]),
  ]);

  const count = z.object({
    total: z.coerce.number().int().nonnegative(),
    monitoredCount: z.coerce.number().int().nonnegative(),
  }).parse(counts[0]);

  return {
    items: z.array(repositoryRowSchema).parse(rows),
    ...count,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getRepository(githubId: number): Promise<Repository | null> {
  const sql = requireSql();
  const rows = await sql.query(`
    SELECT ${repositoryColumns()}
    FROM repositories
    WHERE github_id = $1
  `, [githubId]);
  return rows[0] ? repositoryRowSchema.parse(rows[0]) : null;
}

export async function listMonitoredRepositories(): Promise<Repository[]> {
  const sql = requireSql();
  const rows = await sql.query(`
    SELECT ${repositoryColumns()}
    FROM repositories
    WHERE monitoring_enabled = true
    ORDER BY full_name
  `);
  return z.array(repositoryRowSchema).parse(rows);
}

export async function setRepositoryMonitoring(githubId: number, enabled: boolean) {
  const sql = requireSql();
  const rows = await sql`
    UPDATE repositories
    SET monitoring_enabled = ${enabled}, updated_at = NOW()
    WHERE github_id = ${githubId}
    RETURNING github_id
  `;
  return rows.length > 0;
}

export class SyncAlreadyRunningError extends Error {
  constructor() {
    super("已有 GitHub 同步正在运行");
    this.name = "SyncAlreadyRunningError";
  }
}

export async function beginSyncRun(trigger: SyncTrigger): Promise<SyncRun> {
  const sql = requireSql();

  try {
    const [, inserted] = await sql.transaction([
      sql`
        UPDATE github_sync_runs
        SET
          status = 'failed',
          finished_at = NOW(),
          lease_expires_at = NULL,
          error_code = 'lease_expired',
          error_message = '同步进程未在租约期限内完成'
        WHERE status = 'running' AND lease_expires_at <= NOW()
      `,
      sql`
        INSERT INTO github_sync_runs (trigger, status, lease_expires_at)
        VALUES (${trigger}, 'running', NOW() + (30 * INTERVAL '1 minute'))
        RETURNING ${sql.unsafe(syncRunColumns())}
      `,
    ]);

    const run = inserted[0];
    if (!run) throw new Error("无法创建同步运行记录");
    return syncRunRowSchema.parse(run);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new SyncAlreadyRunningError();
    }
    throw error;
  }
}

export async function failSyncRun(runId: number, errorCode: string, errorMessage: string) {
  const sql = requireSql();
  await sql`
    UPDATE github_sync_runs
    SET
      status = 'failed',
      finished_at = NOW(),
      lease_expires_at = NULL,
      error_code = ${errorCode},
      error_message = ${errorMessage.slice(0, 500)}
    WHERE id = ${runId} AND status = 'running'
  `;
}

export async function commitGitHubSync(
  runId: number,
  repositories: GitHubRepository[],
  capturedAt: string,
): Promise<SyncRun> {
  const sql = requireSql();
  const payload = JSON.stringify(repositories.map((repository) => ({
    github_id: repository.githubId,
    full_name: repository.fullName,
    html_url: repository.htmlUrl,
    description: repository.description,
    homepage_url: repository.homepageUrl,
    topics: repository.topics,
    language: repository.language,
    visibility: repository.visibility,
    archived: repository.archived,
    github_updated_at: repository.githubUpdatedAt,
    pushed_at: repository.pushedAt,
    stars: repository.stars,
    forks: repository.forks,
  })));
  const githubIds = JSON.stringify(repositories.map((repository) => repository.githubId));

  const [, , , completed] = await sql.transaction([
    sql`
      INSERT INTO repositories (
        github_id, full_name, html_url, description, homepage_url, topics, language,
        visibility, archived, github_updated_at, pushed_at, last_seen_at
      )
      SELECT
        input.github_id, input.full_name, input.html_url, input.description,
        input.homepage_url, input.topics, input.language, input.visibility,
        input.archived, input.github_updated_at, input.pushed_at, ${capturedAt}
      FROM jsonb_to_recordset(${payload}::jsonb) AS input(
        github_id BIGINT,
        full_name TEXT,
        html_url TEXT,
        description TEXT,
        homepage_url TEXT,
        topics TEXT[],
        language TEXT,
        visibility TEXT,
        archived BOOLEAN,
        github_updated_at TIMESTAMPTZ,
        pushed_at TIMESTAMPTZ,
        stars INTEGER,
        forks INTEGER
      )
      ON CONFLICT (github_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        html_url = EXCLUDED.html_url,
        description = EXCLUDED.description,
        homepage_url = EXCLUDED.homepage_url,
        topics = EXCLUDED.topics,
        language = EXCLUDED.language,
        visibility = EXCLUDED.visibility,
        archived = EXCLUDED.archived,
        github_updated_at = EXCLUDED.github_updated_at,
        pushed_at = EXCLUDED.pushed_at,
        last_seen_at = EXCLUDED.last_seen_at,
        unavailable_at = NULL,
        updated_at = CASE
          WHEN ROW(
            repositories.full_name,
            repositories.html_url,
            repositories.description,
            repositories.homepage_url,
            repositories.topics,
            repositories.language,
            repositories.visibility,
            repositories.archived,
            repositories.github_updated_at,
            repositories.pushed_at,
            repositories.unavailable_at
          ) IS DISTINCT FROM ROW(
            EXCLUDED.full_name,
            EXCLUDED.html_url,
            EXCLUDED.description,
            EXCLUDED.homepage_url,
            EXCLUDED.topics,
            EXCLUDED.language,
            EXCLUDED.visibility,
            EXCLUDED.archived,
            EXCLUDED.github_updated_at,
            EXCLUDED.pushed_at,
            NULL
          ) THEN NOW()
          ELSE repositories.updated_at
        END
    `,
    sql`
      UPDATE repositories
      SET unavailable_at = COALESCE(unavailable_at, ${capturedAt}), updated_at = NOW()
      WHERE NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(${githubIds}::jsonb) AS visible(github_id)
        WHERE visible.github_id::BIGINT = repositories.github_id
      )
        AND unavailable_at IS NULL
    `,
    sql`
      INSERT INTO repository_metric_snapshots (run_id, github_id, stars, forks)
      SELECT ${runId}, input.github_id, input.stars, input.forks
      FROM jsonb_to_recordset(${payload}::jsonb) AS input(
        github_id BIGINT,
        full_name TEXT,
        html_url TEXT,
        description TEXT,
        homepage_url TEXT,
        topics TEXT[],
        language TEXT,
        visibility TEXT,
        archived BOOLEAN,
        github_updated_at TIMESTAMPTZ,
        pushed_at TIMESTAMPTZ,
        stars INTEGER,
        forks INTEGER
      )
      JOIN repositories ON repositories.github_id = input.github_id
      WHERE repositories.monitoring_enabled = true
        AND repositories.unavailable_at IS NULL
    `,
    sql`
      UPDATE github_sync_runs
      SET
        status = 'completed',
        lease_expires_at = NULL,
        captured_at = ${capturedAt},
        finished_at = NOW(),
        repository_count = ${repositories.length},
        snapshot_count = (
          SELECT COUNT(*)::int
          FROM repository_metric_snapshots
          WHERE run_id = ${runId}
        ),
        error_code = NULL,
        error_message = NULL
      WHERE id = ${runId} AND status = 'running'
      RETURNING ${sql.unsafe(syncRunColumns())}
    `,
  ]);

  const run = completed[0];
  if (!run) throw new Error("同步运行已不再处于 running 状态");
  return syncRunRowSchema.parse(run);
}

export async function getLatestSyncRun(input?: { completedOnly?: boolean }): Promise<SyncRun | null> {
  const sql = requireSql();
  const statusFilter = input?.completedOnly ? "WHERE status = 'completed'" : "";
  const rows = await sql.query(`
    SELECT ${syncRunColumns()}
    FROM github_sync_runs
    ${statusFilter}
    ORDER BY started_at DESC
    LIMIT 1
  `);
  return rows[0] ? syncRunRowSchema.parse(rows[0]) : null;
}

export async function getMetricSnapshots(from: string, to: string): Promise<MetricSnapshot[]> {
  const sql = requireSql();
  const rows = await sql`
    SELECT
      snapshots.run_id AS "runId",
      snapshots.github_id AS "githubId",
      repositories.full_name AS repository,
      repositories.html_url AS url,
      repositories.visibility,
      runs.captured_at AS "capturedAt",
      snapshots.stars,
      snapshots.forks
    FROM repository_metric_snapshots snapshots
    JOIN github_sync_runs runs ON runs.id = snapshots.run_id
    JOIN repositories ON repositories.github_id = snapshots.github_id
    WHERE runs.status = 'completed'
      AND runs.captured_at >= (${from}::date AT TIME ZONE 'Asia/Shanghai')
      AND runs.captured_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'Asia/Shanghai')
    ORDER BY runs.captured_at ASC, repositories.full_name ASC
  `;
  return z.array(metricSnapshotRowSchema).parse(rows);
}

export async function getLatestMetricSnapshots(): Promise<MetricSnapshot[]> {
  const sql = requireSql();
  const rows = await sql`
    SELECT DISTINCT ON (snapshots.github_id)
      snapshots.run_id AS "runId",
      snapshots.github_id AS "githubId",
      repositories.full_name AS repository,
      repositories.html_url AS url,
      repositories.visibility,
      runs.captured_at AS "capturedAt",
      snapshots.stars,
      snapshots.forks
    FROM repository_metric_snapshots snapshots
    JOIN github_sync_runs runs ON runs.id = snapshots.run_id AND runs.status = 'completed'
    JOIN repositories ON repositories.github_id = snapshots.github_id
    ORDER BY snapshots.github_id, runs.captured_at DESC
  `;
  return z.array(metricSnapshotRowSchema).parse(rows);
}
