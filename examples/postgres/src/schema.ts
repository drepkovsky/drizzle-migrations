import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, uuid, varchar } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name'),
  uuid: uuid('slug'),
})

export const userRelations = relations(usersTable, (h) => ({
  posts: h.many(postsTable),
}))

export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }),
  newColumn: varchar('new_column'),
  content: varchar('content'),
  userId: integer('user_id').references(() => usersTable.id),
})

export const postRelations = relations(postsTable, (h) => ({
  user: h.one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
}))
