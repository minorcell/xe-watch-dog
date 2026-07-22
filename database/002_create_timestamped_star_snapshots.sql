CREATE TABLE IF NOT EXISTS snapshot_runs (
  id BIGSERIAL PRIMARY KEY,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('completed', 'partial', 'failed')),
  success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0)
);

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

CREATE INDEX IF NOT EXISTS repository_star_snapshots_repository_captured_idx
ON repository_star_snapshots (repository, captured_at DESC);

CREATE INDEX IF NOT EXISTS repository_star_snapshots_captured_idx
ON repository_star_snapshots (captured_at DESC);
