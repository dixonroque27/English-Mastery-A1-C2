CREATE TABLE IF NOT EXISTS diagnostic_profiles (
  user_id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnostic_profiles_level_idx ON diagnostic_profiles(level);