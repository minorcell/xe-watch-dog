-- Watchdog schema

-- Tracked repos + metadata synced from GitHub
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
);

-- Scheduler task toggles
CREATE TABLE IF NOT EXISTS scheduler_tasks (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scheduler_tasks (name, enabled, description) VALUES
  ('sync-org-repos', true, '从 GitHub 同步组织下全量仓库列表'),
  ('sync-repo-metadata', true, '同步监控中仓库的详细元信息'),
  ('collect-star-snapshots', true, '采集监控中仓库的 Star 快照')
ON CONFLICT (name) DO NOTHING;

-- Snapshot run metadata
CREATE TABLE IF NOT EXISTS snapshot_runs (
  id BIGSERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0)
);

-- Per-repo star snapshot data
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
);

CREATE INDEX IF NOT EXISTS repository_star_snapshots_repository_captured_idx ON repository_star_snapshots (repository, captured_at DESC);
CREATE INDEX IF NOT EXISTS repository_star_snapshots_captured_idx ON repository_star_snapshots (captured_at DESC);
