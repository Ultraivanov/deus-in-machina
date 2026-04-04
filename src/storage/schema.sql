PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscription (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TEXT,
  current_period_end TEXT,
  limits_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  summary TEXT NOT NULL,
  repo_url TEXT,
  status TEXT NOT NULL,
  current_phase_id TEXT,
  current_block_id TEXT,
  current_task_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS phase (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS block (
  id TEXT PRIMARY KEY,
  phase_id TEXT NOT NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  file_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (phase_id) REFERENCES phase (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL,
  title TEXT NOT NULL,
  user_value TEXT NOT NULL,
  technical_goal TEXT NOT NULL,
  definition_of_done_json TEXT NOT NULL,
  constraints_json TEXT NOT NULL,
  allowed_files_json TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (block_id) REFERENCES block (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  assistant TEXT NOT NULL,
  prompt_snapshot TEXT NOT NULL,
  change_plan_json TEXT,
  result_summary TEXT,
  changed_files_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE
);
