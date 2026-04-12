import { boolean, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects.js';

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    source: text('source').notNull(),
    visibility: varchar('visibility', { length: 20 }).notNull().default('public'),
    enabled: boolean('enabled').notNull().default(true),
    metadata: text('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('skills_project_name_idx').on(t.projectId, t.name)]
);
