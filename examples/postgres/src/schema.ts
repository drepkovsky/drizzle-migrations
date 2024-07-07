import { relations } from 'drizzle-orm'
import { integer, pgTable, primaryKey, serial, text, uuid, varchar } from 'drizzle-orm/pg-core'

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

export const booksTable = pgTable('books', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 64 }),
  description: text('description'),
  authorId: integer('user_id').references(() => usersTable.id),
})

export const postsBooksTable = pgTable(
  'posts_books',
  {
    bookId: uuid('book_id').references(() => booksTable.id),
    postId: integer('post_id').references(() => postsTable.id),
  },
  (t) => ({
    compoundIndex: primaryKey({ columns: [t.bookId, t.postId] }),
  })
)

export const postRelations = relations(postsTable, (h) => ({
  user: h.one(usersTable, {
    fields: [postsTable.userId],
    references: [usersTable.id],
  }),
}))
