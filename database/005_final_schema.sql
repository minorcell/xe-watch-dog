-- Final schema per PRD
-- Drop everything old
DROP TABLE IF EXISTS org_group_members, org_groups, org_people, org_projects CASCADE;
DROP TABLE IF EXISTS repo_members CASCADE;
DROP TABLE IF EXISTS repos CASCADE;
DROP TABLE IF EXISTS people CASCADE;

-- People: github_id → real_name
CREATE TABLE people (
  github_id TEXT PRIMARY KEY,
  real_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repos: full org mirror, monitoring_enabled controls tracking
CREATE TABLE repos (
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
);

-- Role assignment
CREATE TABLE repo_members (
  github_repo TEXT NOT NULL REFERENCES repos(github_repo) ON DELETE CASCADE,
  github_id TEXT NOT NULL REFERENCES people(github_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('mentor','assistant','lead','member')),
  PRIMARY KEY (github_repo, github_id)
);

CREATE INDEX IF NOT EXISTS repo_members_github_id_idx ON repo_members (github_id);

-- Scheduler task toggles
CREATE TABLE scheduler_tasks (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scheduler_tasks (name, enabled, description) VALUES
  ('sync-org-repos', true, '从 GitHub 同步组织下全量仓库列表'),
  ('sync-repo-metadata', true, '同步监控中仓库的详细元信息（description, topics, homepage）'),
  ('collect-star-snapshots', true, '采集监控中仓库的 Star/Fork/Issue 快照'),
  ('sync-team-members', true, '同步监控中仓库的 Team 成员到人员库')
ON CONFLICT (name) DO NOTHING;
