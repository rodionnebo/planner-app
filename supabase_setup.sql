-- Supabase Setup Script for Planner App

-- 1. Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Users can only see their own tasks
CREATE POLICY "Users can only access their own tasks"
ON tasks
FOR ALL
USING (auth.uid() = user_id);

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date_str);

-- 4. Unique constraint for upsert (if not already present)
-- ALTER TABLE tasks ADD CONSTRAINT tasks_task_id_key UNIQUE (task_id);
