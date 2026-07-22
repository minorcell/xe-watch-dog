/**
 * One-time import: reads app/data/info.yaml and writes to Neon DB.
 * Usage: pnpm db:import
 * Requires DATABASE_URL in .env.local
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lightweight Neon client loader
async function getSql() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try {
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
      if (match) dbUrl = match[1].trim();
    } catch {
      // ignore
    }
  }
  if (!dbUrl) throw new Error("DATABASE_URL not found in env or .env.local");

  const { neon } = await import("@neondatabase/serverless");
  return neon(dbUrl);
}

const configPath = path.join(__dirname, "..", "app", "data", "info.yaml");

async function main() {
  console.log("📖 Reading info.yaml...");
  const yamlText = readFileSync(configPath, "utf-8");
  const config = parse(yamlText);

  if (!config?.groups?.length) {
    console.error("❌ No groups found in info.yaml");
    process.exit(1);
  }

  const sql = await getSql();
  console.log(`🔌 Connected to Neon. Importing ${config.groups.length} groups...`);

  // Create schema
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

  const projectCache = new Map();
  const personCache = new Map();

  for (const g of config.groups) {
    const projectKey = `${g.project_name}|${g.topic}`;

    // Upsert project
    if (!projectCache.has(projectKey)) {
      let [p] = await sql`SELECT id FROM org_projects WHERE name = ${g.project_name} AND topic = ${g.topic}`;
      if (!p) {
        [p] = await sql`INSERT INTO org_projects (name, topic) VALUES (${g.project_name}, ${g.topic}) RETURNING id`;
      }
      projectCache.set(projectKey, p.id);
    }

    // Helper: upsert person by github_id
    const ensurePerson = async (name, githubId) => {
      const key = githubId || name;
      if (personCache.has(key)) return personCache.get(key);

      let [p] = githubId
        ? await sql`SELECT id FROM org_people WHERE github_id = ${githubId}`
        : [null];
      if (p) {
        await sql`UPDATE org_people SET name = ${name}, updated_at = NOW() WHERE id = ${p.id}`;
        personCache.set(key, p.id);
        return p.id;
      }

      [p] = await sql`INSERT INTO org_people (name, github_id) VALUES (${name}, ${githubId}) RETURNING id`;
      personCache.set(key, p.id);
      return p.id;
    };

    const mentorId = await ensurePerson(g.mentor.name, g.mentor.id);
    const assistantId = await ensurePerson(g.assistant.name, g.assistant.id);
    const memberIds = await Promise.all(
      (g.members ?? []).map((m) => ensurePerson(m.name, m.id)),
    );

    const projectId = projectCache.get(projectKey);

    // Check for duplicate group (same repo)
    const [existing] = await sql`SELECT id FROM org_groups WHERE github_repo = ${g.github_repo}`;
    let groupId;
    if (existing) {
      await sql`
        UPDATE org_groups SET project_id = ${projectId}, mentor_id = ${mentorId},
          assistant_id = ${assistantId}, github_team = ${g.github_team}, updated_at = NOW()
        WHERE id = ${existing.id}
      `;
      groupId = existing.id;
      await sql`DELETE FROM org_group_members WHERE group_id = ${groupId}`;
    } else {
      const [grp] = await sql`
        INSERT INTO org_groups (project_id, mentor_id, assistant_id, github_repo, github_team)
        VALUES (${projectId}, ${mentorId}, ${assistantId}, ${g.github_repo}, ${g.github_team})
        RETURNING id
      `;
      groupId = grp.id;
    }

    // Insert members
    for (const mid of memberIds) {
      await sql`INSERT INTO org_group_members (group_id, person_id) VALUES (${groupId}, ${mid}) ON CONFLICT DO NOTHING`;
    }

    process.stdout.write(".");
  }

  // Counts
  const [pc] = await sql`SELECT COUNT(*)::int AS count FROM org_projects`;
  const [pp] = await sql`SELECT COUNT(*)::int AS count FROM org_people`;
  const [gc] = await sql`SELECT COUNT(*)::int AS count FROM org_groups`;

  console.log(`\n✅ Import done: ${pc.count} projects, ${pp.count} people, ${gc.count} groups`);
}

main().catch((err) => {
  console.error("❌ Import failed:", err.message);
  process.exit(1);
});
