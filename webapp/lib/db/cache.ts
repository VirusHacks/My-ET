/**
 * lib/db/cache.ts
 * Helper utility to get and set AI Studio responses from NeonDB cache.
 */

import { eq } from 'drizzle-orm';
import { db } from './client';
import { studioCache } from './schema';
import crypto from 'crypto';

/**
 * Generate a SHA-256 hash to use as an ID for caching tool responses.
 */
function generateCacheId(tool: string, articleText: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${tool}::${articleText}`);
  return hash.digest('hex');
}

/**
 * Fetch a cached AI response for a specific tool and article text.
 */
export async function getCachedStudioResponse(tool: string, articleText: string) {
  const id = generateCacheId(tool, articleText);
  try {
    const cached = await db
      .select({ response: studioCache.response })
      .from(studioCache)
      .where(eq(studioCache.id, id))
      .limit(1);

    if (cached.length > 0) {
      console.log(`[Cache HIT] ${tool}`);
      return cached[0].response;
    }
  } catch (error) {
    console.error(`[Cache GET error] ${tool}:`, error);
  }
  return null;
}

/**
 * Save an AI response to the DB cache for a specific tool and article text.
 */
export async function setCachedStudioResponse(
  tool: string,
  articleText: string,
  url: string,
  response: any
) {
  const id = generateCacheId(tool, articleText);
  try {
    await db
      .insert(studioCache)
      .values({
        id,
        tool,
        articleUrl: url,
        response,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing(); // Ignore if it's already there
    
    console.log(`[Cache SET] ${tool}`);
  } catch (error) {
    console.error(`[Cache SET error] ${tool}:`, error);
  }
}
