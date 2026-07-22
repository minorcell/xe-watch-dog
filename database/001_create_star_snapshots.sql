CREATE TABLE IF NOT EXISTS star_snapshots (
  repository TEXT NOT NULL,
  captured_on DATE NOT NULL DEFAULT CURRENT_DATE,
  stars INTEGER NOT NULL CHECK (stars >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (repository, captured_on)
);

CREATE INDEX IF NOT EXISTS star_snapshots_captured_on_idx
ON star_snapshots (captured_on DESC);
