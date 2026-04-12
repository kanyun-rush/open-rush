import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').defaultRandom().primaryKey(),
  scope: varchar('scope', { length: 20 }).notNull(),
  scopeId: uuid('scope_id'),
  name: varchar('name', { length: 255 }).notNull(),
  transport: varchar('transport', { length: 20 }).notNull(),
  command: text('command'),
  args: jsonb('args'),
  url: text('url'),
  env: jsonb('env'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
