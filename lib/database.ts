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

// ── Organization schema ────────────────────────────────────────

export async function ensureOrganizationSchema() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");

  await sql`
    CREATE TABLE IF NOT EXISTS org_projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS org_people (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      github_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS org_groups (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES org_projects(id) ON DELETE CASCADE,
      mentor_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE RESTRICT,
      assistant_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE RESTRICT,
      github_repo TEXT NOT NULL,
      github_team TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS org_group_members (
      group_id INTEGER NOT NULL REFERENCES org_groups(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, person_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS org_groups_github_repo_idx ON org_groups (github_repo)`;
  await sql`CREATE INDEX IF NOT EXISTS org_group_members_group_idx ON org_group_members (group_id)`;
}

// ── Organization types ─────────────────────────────────────────

export type OrgProject = {
  id: number;
  name: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgPerson = {
  id: number;
  name: string;
  githubId: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgGroup = {
  id: number;
  projectId: number;
  projectName: string;
  projectTopic: string;
  mentorId: number;
  mentorName: string;
  mentorGithubId: string;
  assistantId: number;
  assistantName: string;
  assistantGithubId: string;
  githubRepo: string;
  githubTeam: string;
  memberIds: number[];
  memberNames: string[];
  createdAt: string;
  updatedAt: string;
};

// ── Projects CRUD ──────────────────────────────────────────────

export async function listProjects(): Promise<OrgProject[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();

  const rows = await sql`
    SELECT id, name, topic, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM org_projects ORDER BY id ASC
  `;
  return rows as OrgProject[];
}

export async function createProject(name: string, topic: string): Promise<OrgProject> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    INSERT INTO org_projects (name, topic) VALUES (${name}, ${topic})
    RETURNING id, name, topic, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return row as OrgProject;
}

export async function updateProject(id: number, name: string, topic: string): Promise<OrgProject | null> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    UPDATE org_projects SET name = ${name}, topic = ${topic}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, topic, created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return (row as OrgProject) ?? null;
}

export async function deleteProject(id: number): Promise<boolean> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [deleted] = await sql`DELETE FROM org_projects WHERE id = ${id} RETURNING id`;
  return deleted !== undefined;
}

// ── People CRUD ────────────────────────────────────────────────

export async function listPeople(): Promise<OrgPerson[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();

  const rows = await sql`
    SELECT id, name, github_id AS "githubId", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM org_people ORDER BY id ASC
  `;
  return rows as OrgPerson[];
}

export async function createPerson(name: string, githubId: string): Promise<OrgPerson> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    INSERT INTO org_people (name, github_id) VALUES (${name}, ${githubId})
    RETURNING id, name, github_id AS "githubId", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return row as OrgPerson;
}

export async function updatePerson(id: number, name: string, githubId: string): Promise<OrgPerson | null> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    UPDATE org_people SET name = ${name}, github_id = ${githubId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, github_id AS "githubId", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return (row as OrgPerson) ?? null;
}

export async function deletePerson(id: number): Promise<boolean> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [deleted] = await sql`DELETE FROM org_people WHERE id = ${id} RETURNING id`;
  return deleted !== undefined;
}

// ── Groups CRUD ────────────────────────────────────────────────

export async function listGroups(): Promise<OrgGroup[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureOrganizationSchema();

  const rows = await sql`
    SELECT
      g.id,
      g.project_id AS "projectId",
      p.name AS "projectName",
      p.topic AS "projectTopic",
      g.mentor_id AS "mentorId",
      m.name AS "mentorName",
      m.github_id AS "mentorGithubId",
      g.assistant_id AS "assistantId",
      a.name AS "assistantName",
      a.github_id AS "assistantGithubId",
      g.github_repo AS "githubRepo",
      g.github_team AS "githubTeam",
      g.created_at AS "createdAt",
      g.updated_at AS "updatedAt"
    FROM org_groups g
    JOIN org_projects p ON g.project_id = p.id
    JOIN org_people m ON g.mentor_id = m.id
    JOIN org_people a ON g.assistant_id = a.id
    ORDER BY g.id ASC
  `;

  // Hydrate member lists
  const groups = await Promise.all(
    rows.map(async (row) => {
      const members = await sql`
        SELECT p.id, p.name
        FROM org_group_members gm
        JOIN org_people p ON gm.person_id = p.id
        WHERE gm.group_id = ${row.id}
        ORDER BY p.id ASC
      `;
      return {
        ...row,
        memberIds: members.map((m) => m.id as number),
        memberNames: members.map((m) => m.name as string),
      } as OrgGroup;
    }),
  );

  return groups;
}

export async function createGroup(data: {
  projectId: number;
  mentorId: number;
  assistantId: number;
  githubRepo: string;
  githubTeam: string;
  memberIds: number[];
}): Promise<OrgGroup> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    INSERT INTO org_groups (project_id, mentor_id, assistant_id, github_repo, github_team)
    VALUES (${data.projectId}, ${data.mentorId}, ${data.assistantId}, ${data.githubRepo}, ${data.githubTeam})
    RETURNING id, project_id AS "projectId", mentor_id AS "mentorId", assistant_id AS "assistantId",
              github_repo AS "githubRepo", github_team AS "githubTeam",
              created_at AS "createdAt", updated_at AS "updatedAt"
  `;

  if (data.memberIds.length > 0) {
    await Promise.all(
      data.memberIds.map((personId) =>
        sql`INSERT INTO org_group_members (group_id, person_id) VALUES (${row.id}, ${personId}) ON CONFLICT DO NOTHING`,
      ),
    );
  }

  // Re-read with joins
  const groups = await listGroups();
  return groups.find((g) => g.id === row.id)!;
}

export async function updateGroup(
  id: number,
  data: {
    projectId: number;
    mentorId: number;
    assistantId: number;
    githubRepo: string;
    githubTeam: string;
    memberIds: number[];
  },
): Promise<OrgGroup | null> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  const [row] = await sql`
    UPDATE org_groups
    SET project_id = ${data.projectId}, mentor_id = ${data.mentorId},
        assistant_id = ${data.assistantId}, github_repo = ${data.githubRepo},
        github_team = ${data.githubTeam}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;
  if (!row) return null;

  // Replace members
  await sql`DELETE FROM org_group_members WHERE group_id = ${id}`;
  if (data.memberIds.length > 0) {
    await Promise.all(
      data.memberIds.map((personId) =>
        sql`INSERT INTO org_group_members (group_id, person_id) VALUES (${id}, ${personId})`,
      ),
    );
  }

  const groups = await listGroups();
  return groups.find((g) => g.id === id) ?? null;
}

export async function deleteGroup(id: number): Promise<boolean> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  await sql`DELETE FROM org_group_members WHERE group_id = ${id}`;
  const [deleted] = await sql`DELETE FROM org_groups WHERE id = ${id} RETURNING id`;
  return deleted !== undefined;
}

// ── Repository detail (for slide-out panel) ────────────────────

export async function getGroupDetailByRepo(repoFullName: string): Promise<OrgGroup | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureOrganizationSchema();

  const groups = await listGroups();
  return groups.find((g) => {
    try {
      const url = new URL(g.githubRepo);
      const parts = url.pathname.split("/").filter(Boolean);
      return `${parts[0]}/${parts[1]}`.toLowerCase() === repoFullName.toLowerCase();
    } catch {
      return false;
    }
  }) ?? null;
}

// ── Bulk import (YAML → DB, one-time) ──────────────────────────

export async function importOrgFromYaml(groups: Array<{
  projectName: string;
  topic: string;
  mentor: { name: string; id: string };
  assistant: { name: string; id: string };
  githubRepo: string;
  githubTeam: string;
  members: Array<{ name: string; id: string }>;
}>) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL 尚未配置");
  await ensureOrganizationSchema();

  // Deduplicate helpers
  const projectCache = new Map<string, number>();
  const personCache = new Map<string, number>(); // key = github_id|name

  for (const g of groups) {
    // Upsert project
    const projectKey = `${g.projectName}|${g.topic}`;
    if (!projectCache.has(projectKey)) {
      const [p] = await sql`
        INSERT INTO org_projects (name, topic) VALUES (${g.projectName}, ${g.topic})
        ON CONFLICT DO NOTHING RETURNING id
      `;
      if (p) {
        projectCache.set(projectKey, p.id as number);
      } else {
        const [existing] = await sql`SELECT id FROM org_projects WHERE name = ${g.projectName} AND topic = ${g.topic}`;
        projectCache.set(projectKey, existing.id as number);
      }
    }

    // Upsert each person
    const ensurePerson = async (name: string, githubId: string): Promise<number> => {
      const personKey = githubId || name;
      if (personCache.has(personKey)) return personCache.get(personKey)!;

      const [existing] = await sql`SELECT id FROM org_people WHERE github_id = ${githubId} AND github_id != ''`;
      if (existing) {
        // Update name if changed
        await sql`UPDATE org_people SET name = ${name}, updated_at = NOW() WHERE id = ${existing.id}`;
        personCache.set(personKey, existing.id as number);
        return existing.id as number;
      }

      const [p] = await sql`
        INSERT INTO org_people (name, github_id) VALUES (${name}, ${githubId})
        RETURNING id
      `;
      personCache.set(personKey, p.id as number);
      return p.id as number;
    };

    const mentorId = await ensurePerson(g.mentor.name, g.mentor.id);
    const assistantId = await ensurePerson(g.assistant.name, g.assistant.id);
    const memberIds = await Promise.all(g.members.map((m) => ensurePerson(m.name, m.id)));

    const projectId = projectCache.get(projectKey)!;

    // Insert group
    const [group] = await sql`
      INSERT INTO org_groups (project_id, mentor_id, assistant_id, github_repo, github_team)
      VALUES (${projectId}, ${mentorId}, ${assistantId}, ${g.githubRepo}, ${g.githubTeam})
      RETURNING id
    `;

    // Insert members
    if (memberIds.length > 0) {
      await Promise.all(
        memberIds.map((personId) =>
          sql`INSERT INTO org_group_members (group_id, person_id) VALUES (${group.id}, ${personId}) ON CONFLICT DO NOTHING`,
        ),
      );
    }
  }

  // Return summary
  const [projectCount, personCount, groupCount] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM org_projects`,
    sql`SELECT COUNT(*)::int AS count FROM org_people`,
    sql`SELECT COUNT(*)::int AS count FROM org_groups`,
  ]);

  return {
    projects: projectCount[0]?.count ?? 0,
    people: personCount[0]?.count ?? 0,
    groups: groupCount[0]?.count ?? 0,
  };
}

// ── Check if org data exists ───────────────────────────────────

export async function isOrgDataAvailable(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureOrganizationSchema();

  const [row] = await sql`SELECT COUNT(*)::int AS count FROM org_groups`;
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
