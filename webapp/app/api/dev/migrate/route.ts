import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  // Security: only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Ensure base table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        sector VARCHAR(50) NOT NULL DEFAULT 'Finance',
        watchlist JSONB NOT NULL DEFAULT '[]'::jsonb,
        location VARCHAR(255) NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new personalisation columns
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) NOT NULL DEFAULT 'English'`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) NOT NULL DEFAULT 'Intermediate'`);

    // Verify structure
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      message: '✅ Migration complete',
      columns: result.rows,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
