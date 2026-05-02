export type JournalColumnId =
  | 'pair' | 'result' | 'pnl' | 'date' | 'session'
  | 'time' | 'confluence' | 'notes' | 'chart' | 'actions'

interface ColumnDef {
  id:    JournalColumnId
  /** Default genişlik yüzdesi (toplam 100). Visible kolonlar için normalize edilir. */
  width: number
  /** Bu kolonu kullanıcı asla gizleyemez (örn. actions her zaman gerekli değil ama isterse gizler). */
  required?: boolean
}

export const JOURNAL_COLUMNS: ColumnDef[] = [
  { id: 'pair',       width: 7  },
  { id: 'result',     width: 7  },
  { id: 'pnl',        width: 8  },
  { id: 'date',       width: 6  },
  { id: 'session',    width: 7  },
  { id: 'time',       width: 6  },
  { id: 'confluence', width: 22 },
  { id: 'notes',      width: 25 },
  { id: 'chart',      width: 6  },
  { id: 'actions',    width: 6  },
]

export const DEFAULT_ENABLED_COLUMNS: JournalColumnId[] =
  JOURNAL_COLUMNS.map(c => c.id)

/** Visible kolonların genişliklerini 100%'e normalize eder. */
export function normalizedColumnWidths(visibleIds: JournalColumnId[]): Record<JournalColumnId, number> {
  const visible = JOURNAL_COLUMNS.filter(c => visibleIds.includes(c.id))
  const sum = visible.reduce((s, c) => s + c.width, 0) || 1
  return Object.fromEntries(visible.map(c => [c.id, (c.width / sum) * 100])) as Record<JournalColumnId, number>
}
