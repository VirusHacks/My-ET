/**
 * scripts/migrate.js
 * Runs the DB migration to add new personalization columns
 */
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  // First ensure the base users table exists
  console.log('🔧 Ensuring base users table exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      sector VARCHAR(50) NOT NULL CHECK (sector IN ('Finance', 'Law', 'Founder', 'Student')),
      watchlist JSONB NOT NULL DEFAULT '[]'::jsonb,
      location VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Add new personalization columns
  console.log('➕ Adding personalization columns...');
  
  // preferred_language
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) NOT NULL DEFAULT 'English'
  `.catch(() => console.log('  preferred_language already exists'));

  // interests
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb
  `.catch(() => console.log('  interests already exists'));

  // experience_level
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) NOT NULL DEFAULT 'Intermediate'
  `.catch(() => console.log('  experience_level already exists'));

  console.log('✅ Migration complete! Users table is ready with all personalization columns.');
  
  // Verify structure
  const result = await sql`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `;
  console.log('\n📋 Current users table schema:');
  result.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default ?? 'none'})`);
  });
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
