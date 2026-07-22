-- Organization management schema for 1024XEngineer training camp
-- Replaces the static info.yaml with a full database-driven model.

CREATE TABLE IF NOT EXISTS org_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_people (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  github_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One group = one mentor + one assistant + one GitHub repo + N members
CREATE TABLE IF NOT EXISTS org_groups (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES org_projects(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE RESTRICT,
  assistant_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE RESTRICT,
  github_repo TEXT NOT NULL,
  github_team TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_group_members (
  group_id INTEGER NOT NULL REFERENCES org_groups(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL REFERENCES org_people(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, person_id)
);

-- Index for looking up groups by repo (used by star tracking)
CREATE INDEX IF NOT EXISTS org_groups_github_repo_idx ON org_groups (github_repo);
CREATE INDEX IF NOT EXISTS org_group_members_group_idx ON org_group_members (group_id);
