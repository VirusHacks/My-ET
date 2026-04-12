-- Create users table for My ET platform
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  sector VARCHAR(50) NOT NULL CHECK (sector IN ('Finance', 'Law', 'Founder', 'Student')),
  watchlist JSONB NOT NULL DEFAULT '[]'::jsonb,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
