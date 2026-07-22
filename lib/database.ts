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
