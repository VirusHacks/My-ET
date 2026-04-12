-- Migration: Add new personalization columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) NOT NULL DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) NOT NULL DEFAULT 'Intermediate';

-- Ensure constraints are valid
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_experience_level_check;
ALTER TABLE users ADD CONSTRAINT users_experience_level_check 
  CHECK (experience_level IN ('Beginner', 'Intermediate', 'Expert'));
