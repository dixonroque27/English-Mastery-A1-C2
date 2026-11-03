CREATE TABLE IF NOT EXISTS skill_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  topic_id text NOT NULL,
  skill text NOT NULL,
  score numeric NOT NULL,
  max_score numeric NOT NULL DEFAULT 10,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS skill_assessments_user_topic_created_idx ON skill_assessments(user_id, topic_id, created_at DESC);