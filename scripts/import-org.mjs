/**
 * One-time import: app/data/info.yaml → Neon DB
 * Usage: pnpm db:import
 * Requires DATABASE_URL in .env.local
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getSql() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    try { const c = readFileSync(envPath, "utf-8"); const m = c.match(/^DATABASE_URL\s*=\s*(.+)$/m); if (m) dbUrl = m[1].trim(); } catch {}
  }
  if (!dbUrl) throw new Error("DATABASE_URL not found");
  const { neon } = await import("@neondatabase/serverless");
  return neon(dbUrl);
}

async function main() {
  const yaml = parse(readFileSync(path.join(__dirname, "..", "app", "data", "info.yaml"), "utf-8"));
  if (!yaml?.groups?.length) { console.error("❌ No groups"); process.exit(1); }

  const sql = await getSql();
  console.log(`🔌 Importing ${yaml.groups.length} groups...`);

  let reposCount = 0, peopleCount = 0;

  for (const g of yaml.groups) {
    if (!g.github_repo) continue;
    const u = new URL(g.github_repo);
    const [o, n] = u.pathname.split("/").filter(Boolean);
    const fullRepo = `${o}/${n.replace(/\.git$/, "")}`;

    await sql`INSERT INTO repos (github_repo, monitoring_enabled) VALUES (${fullRepo}, true) ON CONFLICT (github_repo) DO UPDATE SET monitoring_enabled = true`;
    reposCount++;

    const ensure = async (name, githubId) => {
      if (!githubId) return;
      const [e] = await sql`SELECT github_id FROM people WHERE github_id = ${githubId}`;
      if (e) {
        await sql`UPDATE people SET real_name = ${name} WHERE github_id = ${githubId}`;
      } else {
        await sql`INSERT INTO people (github_id, real_name) VALUES (${githubId}, ${name})`;
        peopleCount++;
      }
    };

    await ensure(g.mentor.name, g.mentor.id);
    await ensure(g.assistant.name, g.assistant.id);
    for (const m of g.members ?? []) await ensure(m.name, m.id);

    if (g.mentor.id) await sql`INSERT INTO repo_members (github_repo, github_id, role) VALUES (${fullRepo}, ${g.mentor.id}, 'mentor') ON CONFLICT (github_repo, github_id) DO UPDATE SET role = 'mentor'`;
    if (g.assistant.id) await sql`INSERT INTO repo_members (github_repo, github_id, role) VALUES (${fullRepo}, ${g.assistant.id}, 'assistant') ON CONFLICT (github_repo, github_id) DO UPDATE SET role = 'assistant'`;
    for (const m of g.members ?? []) {
      if (m.id) await sql`INSERT INTO repo_members (github_repo, github_id, role) VALUES (${fullRepo}, ${m.id}, 'member') ON CONFLICT (github_repo, github_id) DO UPDATE SET role = 'member'`;
    }
    process.stdout.write(".");
  }

  const [pc] = await sql`SELECT COUNT(*)::int AS count FROM people`;
  const [rc] = await sql`SELECT COUNT(*)::int AS count FROM repos`;
  console.log(`\n✅ ${rc.count} repos, ${pc.count} people`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
