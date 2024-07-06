import type { ConfigDialect, DBClient } from '..'
import type { MigrationContext } from './drizzle-config'

export function startTransaction<TDialect extends ConfigDialect>(
  ctx: MigrationContext<any, TDialect>,
  cb: (trx: DBClient<TDialect>) => Promise<unknown>
) {
  if (ctx.dialect === 'sqlite') {
    return (ctx.client as DBClient<'sqlite'>).transaction(async (trx) => {
      return cb(trx as any)
    })
  }

  if (ctx.dialect === 'mysql') {
    return (ctx.client as DBClient<'mysql'>).transaction(async (trx) => {
      return cb(trx as any)
    })
  }

  if (ctx.dialect === 'postgresql') {
    return (ctx.client as DBClient<'postgresql'>).transaction(async (trx) => {
      return cb(trx as any)
    })
  }

  throw new Error('Unsupported dialect')
}
