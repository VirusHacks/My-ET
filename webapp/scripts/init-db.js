import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function initializeDatabase() {
  console.log('📦 Initializing database...');

  try {
    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        sector VARCHAR(50) NOT NULL,
        watchlist JSONB NOT NULL DEFAULT '[]',
        location VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create studio_cache table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS studio_cache (
        id TEXT PRIMARY KEY,
        article_url VARCHAR(500) NOT NULL,
        tool VARCHAR(50) NOT NULL,
        response JSONB NOT NULL,
        created_at TEXT NOT NULL
      )
    `;

    console.log('✅ Database initialized successfully');
    console.log('✅ Users table created or already exists');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
