CREATE TABLE repositories (
  github_id BIGINT PRIMARY KEY,
  full_name TEXT NOT NULL UNIQUE,
  html_url TEXT NOT NULL,
  description TEXT,
  homepage_url TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  language TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'internal')),
  archived BOOLEAN NOT NULL DEFAULT false,
  monitoring_enabled BOOLEAN NOT NULL DEFAULT false,
  github_updated_at TIMESTAMPTZ NOT NULL,
  pushed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL,
  unavailable_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:split
CREATE TABLE github_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'vercel-cron', 'internal-cron')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_expires_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  repository_count INTEGER CHECK (repository_count >= 0),
  snapshot_count INTEGER CHECK (snapshot_count >= 0),
  error_code TEXT,
  error_message TEXT,
  CHECK (status <> 'running' OR lease_expires_at IS NOT NULL),
  CHECK (
    (status = 'running' AND finished_at IS NULL)
    OR (status <> 'running' AND finished_at IS NOT NULL)
  )
);

-- migrate:split
CREATE UNIQUE INDEX github_sync_runs_one_running_idx
ON github_sync_runs ((1))
WHERE status = 'running';

-- migrate:split
CREATE INDEX github_sync_runs_completed_captured_idx
ON github_sync_runs (captured_at DESC)
WHERE status = 'completed';

-- migrate:split
CREATE TABLE repository_metric_snapshots (
  run_id BIGINT NOT NULL REFERENCES github_sync_runs(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL REFERENCES repositories(github_id),
  stars INTEGER NOT NULL CHECK (stars >= 0),
  forks INTEGER NOT NULL CHECK (forks >= 0),
  PRIMARY KEY (run_id, github_id)
);

-- migrate:split
CREATE INDEX repository_metric_snapshots_repository_idx
ON repository_metric_snapshots (github_id, run_id DESC);
