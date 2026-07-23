import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const migrationsDirectory = path.join(process.cwd(), "database", "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file))
  .sort();

const sql = neon(databaseUrl);

await sql.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum TEXT NOT NULL
  )
`);

for (const file of migrationFiles) {
  const source = await readFile(path.join(migrationsDirectory, file), "utf8");
  const checksum = createHash("sha256").update(source).digest("hex");
  const [applied] = await sql`
    SELECT checksum FROM schema_migrations WHERE version = ${file}
  `;

  if (applied) {
    if (applied.checksum !== checksum) {
      throw new Error(`Migration checksum mismatch: ${file}`);
    }
    console.log(`Already applied: ${file}`);
    continue;
  }

  const statements = source
    .split(/^-- migrate:split\s*$/m)
    .map((statement) => statement.trim())
    .filter(Boolean);

  await sql.transaction([
    ...statements.map((statement) => sql.query(statement)),
    sql`INSERT INTO schema_migrations (version, checksum) VALUES (${file}, ${checksum})`,
  ]);

  console.log(`Applied: ${file}`);
}
