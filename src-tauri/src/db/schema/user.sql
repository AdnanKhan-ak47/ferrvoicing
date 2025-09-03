-- app_data/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_onboarded BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL
);
