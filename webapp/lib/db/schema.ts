import { pgTable, text, jsonb, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  sector: varchar('sector', {
    enum: ['Finance', 'Law', 'Founder', 'Student'],
  }).notNull(),
  watchlist: jsonb('watchlist').$type<string[]>().notNull().default([]),
  location: varchar('location', { length: 255 }).notNull(),
  // Extended personalization fields
  preferredLanguage: varchar('preferred_language', { length: 50 }).notNull().default('English'),
  interests: jsonb('interests').$type<string[]>().notNull().default([]),
  experienceLevel: varchar('experience_level', {
    enum: ['Beginner', 'Intermediate', 'Expert'],
  }).notNull().default('Intermediate'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const studioCache = pgTable('studio_cache', {
  id: text('id').primaryKey(), // SHA-256 hash of (tool + article content)
  articleUrl: varchar('article_url', { length: 500 }).notNull(),
  tool: varchar('tool', { length: 50 }).notNull(),
  response: jsonb('response').notNull(),
  createdAt: text('created_at').notNull(), // We can use ISO strings for simplicity
});

export type StudioCache = typeof studioCache.$inferSelect;
export type NewStudioCache = typeof studioCache.$inferInsert;
