import { jsonb, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const userMemories = pgTable('user_memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').notNull(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  category: varchar('category', { length: 20 }).notNull().default('fact'),
  importance: real('importance').notNull().default(0.5),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow().notNull(),
});
