/**
 * Local mode — a tiny, browser-only stand-in for the subset of supabase-js
 * the app uses. When no Supabase project is configured, every table lives
 * in localStorage and the "account" is a single local profile, so the
 * journal works out of the box with zero API keys or sign-up.
 */

type Row = Record<string, unknown>
type Result<T> = { data: T; error: LocalError | null; count?: number | null }

export interface LocalError {
  message: string
  code?: string
}

const DB_PREFIX = 'qj:db:'
const SESSION_KEY = 'qj:local-session'
export const LOCAL_USER_ID = '00000000-0000-4000-8000-000000000001'
export const LOCAL_TABLES = [
  'profiles',
  'trades',
  'trade_confirmations',
  'trade_mistakes',
  'broker_connections',
  'blog_posts',
  'audit_logs',
] as const

const RELATIONS: Record<string, string> = {
  trade_confirmations: 'trade_id',
  trade_mistakes: 'trade_id',
}

const UNIQUE: Record<string, string[][]> = {
  trades: [['user_id', 'csv_fingerprint']],
  profiles: [['username']],
  blog_posts: [['slug']],
  broker_connections: [['user_id', 'broker', 'account_id']],
}

const CASCADE: Record<string, { table: string; fk: string }[]> = {
  trades: [
    { table: 'trade_confirmations', fk: 'trade_id' },
    { table: 'trade_mistakes', fk: 'trade_id' },
  ],
}

function read(table: string): Row[] {
  try {
    const raw = localStorage.getItem(DB_PREFIX + table)
    return raw ? (JSON.parse(raw) as Row[]) : []
  } catch {
    return []
  }
}

function write(table: string, rows: Row[]): void {
  localStorage.setItem(DB_PREFIX + table, JSON.stringify(rows))
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function withDefaults(table: string, row: Row): Row {
  const now = new Date().toISOString()
  const base: Row = { id: uuid(), created_at: now }
  if (table !== 'trade_confirmations' && table !== 'trade_mistakes' && table !== 'audit_logs') {
    base.updated_at = now
  }
  if (table === 'trades') {
    base.source = 'csv'
    base.is_complete = false
  }
  if (table === 'blog_posts') {
    base.body = ''
    base.read_minutes = 1
    base.published = false
  }
  return { ...base, ...row }
}

function violates(table: string, rows: Row[], candidate: Row, ignoreId?: unknown): boolean {
  for (const cols of UNIQUE[table] ?? []) {
    if (cols.some(c => candidate[c] === null || candidate[c] === undefined)) continue
    if (rows.some(r => r.id !== ignoreId && cols.every(c => r[c] === candidate[c]))) return true
  }
  return false
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function parseRelations(columns: string | undefined): string[] {
  if (!columns) return []
  return Array.from(columns.matchAll(/([a-z_]+)\s*\(\s*\*\s*\)/g)).map(m => m[1])
}

type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete'
type Order = { column: string; ascending: boolean; nullsFirst: boolean }

class LocalQuery<T = Row[]> implements PromiseLike<Result<T>> {
  private op: Op = 'select'
  private payload: Row[] = []
  private patch: Row = {}
  private filters: [string, unknown][] = []
  private orders: Order[] = []
  private relations: string[] = []
  private returning = false
  private cardinality: 'many' | 'single' | 'maybe' = 'many'
  private max: number | null = null
  private conflict: string[] | null = null

  private readonly table: string

  constructor(table: string) {
    this.table = table
  }

  select(columns?: string): this {
    if (this.op === 'select') this.relations = parseRelations(columns)
    else this.returning = true
    return this
  }

  insert(values: Row | Row[]): this {
    this.op = 'insert'
    this.payload = Array.isArray(values) ? values : [values]
    return this
  }

  upsert(values: Row | Row[], opts?: { onConflict?: string }): this {
    this.op = 'upsert'
    this.payload = Array.isArray(values) ? values : [values]
    this.conflict = opts?.onConflict ? opts.onConflict.split(',').map(s => s.trim()) : ['id']
    return this
  }

  update(patch: Row): this {
    this.op = 'update'
    this.patch = patch
    return this
  }

  delete(): this {
    this.op = 'delete'
    return this
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value])
    return this
  }

  match(query: Row): this {
    for (const [k, v] of Object.entries(query)) this.filters.push([k, v])
    return this
  }

  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): this {
    const ascending = opts?.ascending ?? true
    this.orders.push({ column, ascending, nullsFirst: opts?.nullsFirst ?? !ascending })
    return this
  }

  limit(n: number): this {
    this.max = n
    return this
  }

  single(): LocalQuery<Row> {
    this.cardinality = 'single'
    return this as unknown as LocalQuery<Row>
  }

  maybeSingle(): LocalQuery<Row | null> {
    this.cardinality = 'maybe'
    return this as unknown as LocalQuery<Row | null>
  }

  then<R1 = Result<T>, R2 = never>(
    onfulfilled?: ((value: Result<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected)
  }

  private matches(row: Row): boolean {
    return this.filters.every(([c, v]) => row[c] === v)
  }

  private shape(rows: Row[]): Result<T> {
    if (this.cardinality === 'many') return { data: rows as T, error: null }
    if (rows.length === 1) return { data: rows[0] as T, error: null }
    if (this.cardinality === 'maybe' && rows.length === 0) return { data: null as T, error: null }
    return {
      data: null as T,
      error: { message: rows.length ? 'Multiple rows returned' : 'No rows found', code: 'PGRST116' },
    }
  }

  private run(): Result<T> {
    const rows = read(this.table)

    if (this.op === 'select') {
      let out = rows.filter(r => this.matches(r))
      for (const o of [...this.orders].reverse()) {
        out = [...out].sort((a, b) => {
          const av = a[o.column]
          const bv = b[o.column]
          const an = av === null || av === undefined
          const bn = bv === null || bv === undefined
          if (an && bn) return 0
          if (an) return o.nullsFirst ? -1 : 1
          if (bn) return o.nullsFirst ? 1 : -1
          return o.ascending ? compare(av, bv) : compare(bv, av)
        })
      }
      if (this.max !== null) out = out.slice(0, this.max)
      if (this.relations.length) {
        const children = Object.fromEntries(this.relations.map(t => [t, read(t)]))
        out = out.map(r => {
          const extra: Row = {}
          for (const t of this.relations) {
            const fk = RELATIONS[t] ?? `${this.table.replace(/s$/, '')}_id`
            extra[t] = children[t].filter(c => c[fk] === r.id)
          }
          return { ...r, ...extra }
        })
      }
      return this.shape(out)
    }

    if (this.op === 'insert') {
      const next = [...rows]
      const added: Row[] = []
      for (const value of this.payload) {
        const row = withDefaults(this.table, value)
        if (violates(this.table, next, row)) {
          return { data: null as T, error: { message: 'duplicate key value violates unique constraint', code: '23505' } }
        }
        next.push(row)
        added.push(row)
      }
      write(this.table, next)
      return this.returning ? this.shape(added) : { data: null as T, error: null }
    }

    if (this.op === 'upsert') {
      const next = [...rows]
      const touched: Row[] = []
      for (const value of this.payload) {
        const keys = this.conflict ?? ['id']
        const idx = next.findIndex(r => keys.every(k => value[k] !== undefined && r[k] === value[k]))
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...value, updated_at: new Date().toISOString() }
          touched.push(next[idx])
        } else {
          const row = withDefaults(this.table, value)
          if (violates(this.table, next, row)) {
            return { data: null as T, error: { message: 'duplicate key value violates unique constraint', code: '23505' } }
          }
          next.push(row)
          touched.push(row)
        }
      }
      write(this.table, next)
      return this.returning ? this.shape(touched) : { data: null as T, error: null }
    }

    if (this.op === 'update') {
      const changed: Row[] = []
      const next = rows.map(r => {
        if (!this.matches(r)) return r
        const updated = { ...r, ...this.patch, ...('updated_at' in r ? { updated_at: new Date().toISOString() } : {}) }
        changed.push(updated)
        return updated
      })
      for (const row of changed) {
        if (violates(this.table, next, row, row.id)) {
          return { data: null as T, error: { message: 'duplicate key value violates unique constraint', code: '23505' } }
        }
      }
      write(this.table, next)
      return this.returning ? this.shape(changed) : { data: null as T, error: null }
    }

    const removed = rows.filter(r => this.matches(r))
    write(this.table, rows.filter(r => !this.matches(r)))
    for (const { table, fk } of CASCADE[this.table] ?? []) {
      const ids = new Set(removed.map(r => r.id))
      write(table, read(table).filter(c => !ids.has(c[fk])))
    }
    return { data: null as T, error: null }
  }
}

type AuthListener = (event: string, session: LocalSession | null) => void

export interface LocalSession {
  access_token: string
  token_type: 'bearer'
  user: {
    id: string
    email: string
    user_metadata: Record<string, unknown>
    app_metadata: Record<string, unknown>
    aud: string
    created_at: string
  }
}

function localSession(): LocalSession {
  return {
    access_token: 'local',
    token_type: 'bearer',
    user: {
      id: LOCAL_USER_ID,
      email: 'local@quarterly.journal',
      user_metadata: {},
      app_metadata: { provider: 'local' },
      aud: 'authenticated',
      created_at: new Date(0).toISOString(),
    },
  }
}

const listeners = new Set<AuthListener>()

function currentSession(): LocalSession | null {
  return localStorage.getItem(SESSION_KEY) === '1' ? localSession() : null
}

function emit(event: string): void {
  const s = currentSession()
  listeners.forEach(fn => fn(event, s))
}

function startSession(): { data: { session: LocalSession; user: LocalSession['user'] }; error: null } {
  localStorage.setItem(SESSION_KEY, '1')
  emit('SIGNED_IN')
  const session = localSession()
  return { data: { session, user: session.user }, error: null }
}

const unsupported = (feature: string) => ({
  data: null,
  error: { message: `${feature} is not available in local mode.` },
})

export const localClient = {
  from: (table: string) => new LocalQuery(table),

  rpc: async (fn: string) => {
    if (fn === 'get_my_role') return { data: 'user', error: null }
    if (fn === 'admin_list_profiles') return { data: read('profiles'), error: null }
    return unsupported(`rpc ${fn}`)
  },

  auth: {
    getSession: async () => ({ data: { session: currentSession() }, error: null }),
    getUser: async () => ({ data: { user: currentSession()?.user ?? null }, error: null }),
    onAuthStateChange: (fn: AuthListener) => {
      listeners.add(fn)
      return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }
    },
    signInWithPassword: async () => startSession(),
    signUp: async () => startSession(),
    signInWithOAuth: async () => startSession(),
    signInLocally: async () => startSession(),
    signOut: async () => {
      localStorage.removeItem(SESSION_KEY)
      emit('SIGNED_OUT')
      return { error: null }
    },
    resetPasswordForEmail: async () => unsupported('Password reset'),
    updateUser: async () => unsupported('Password change'),
    mfa: {
      listFactors: async () => ({ data: { totp: [], all: [] }, error: null }),
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        error: null,
      }),
      enroll: async () => unsupported('Two-factor authentication'),
      unenroll: async () => unsupported('Two-factor authentication'),
      challenge: async () => unsupported('Two-factor authentication'),
      verify: async () => unsupported('Two-factor authentication'),
    },
  },

  storage: {
    from: () => ({
      upload: async () => unsupported('File upload'),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
}

export interface LocalBackup {
  app: 'quarterly-journal'
  version: 1
  exportedAt: string
  tables: Record<string, Row[]>
}

export function exportLocalData(): LocalBackup {
  return {
    app: 'quarterly-journal',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: Object.fromEntries(LOCAL_TABLES.map(t => [t, read(t)])),
  }
}

export function importLocalData(backup: unknown): number {
  const b = backup as Partial<LocalBackup>
  if (!b || b.app !== 'quarterly-journal' || typeof b.tables !== 'object' || !b.tables) {
    throw new Error('This file is not a Quarterly Journal backup.')
  }
  let total = 0
  for (const t of LOCAL_TABLES) {
    const rows = b.tables[t]
    if (!Array.isArray(rows)) continue
    const own = rows.map(r => ('user_id' in r ? { ...r, user_id: LOCAL_USER_ID } : r))
    const fixed = t === 'profiles' ? own.slice(0, 1).map(r => ({ ...r, id: LOCAL_USER_ID })) : own
    write(t, fixed)
    if (t === 'trades') total = fixed.length
  }
  return total
}
