import { useEffect, useRef, useState } from 'react'
import type { ChangelogEntry, ChangelogPage } from '../objects'

const API_BASE = 'https://api.aredl.net/v2'

type Mode = 'classic' | 'platformer'

// Versión compacta pensada para incrustarse en la Home.
// Se muestran muchos cambios por página y la lista tiene scroll interno,
// así no se generan tantas páginas como la web original.
const PER_PAGE = 50

async function fetchChangelog(mode: Mode, page: number): Promise<ChangelogPage> {
  // Los changelogs de la lista clásica y de la de plataforma viven en
  // endpoints distintos pero comparten formato.
  const list = mode === 'platformer' ? 'arepl' : 'aredl'
  const response = await fetch(`${API_BASE}/api/${list}/changelog?page=${page}&per_page=${PER_PAGE}`)
  if (!response.ok) {
    throw new Error('Failed to fetch changelog')
  }
  return response.json() as Promise<ChangelogPage>
}

// Clave de día (UTC) para agrupar las entradas igual que la web de la AREDL.
function dayKey(createdAt: string): string {
  return createdAt.slice(0, 10)
}

function formatDay(key: string): string {
  const date = new Date(`${key}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type ActionKind =
  | 'Pending'
  | 'Placed'
  | 'Raised'
  | 'Lowered'
  | 'Removed'
  | 'Swapped'
  | 'MovedToLegacy'
  | 'MovedFromLegacy'
  | 'Unknown'

function actionMeta(entry: ChangelogEntry): { kind: ActionKind; label: string; tone: string } {
  const action = entry.action
  if (action === 'Pending') return { kind: 'Pending', label: 'Pendiente', tone: 'pending' }
  if ('Placed' in action) return { kind: 'Placed', label: 'Colocado', tone: 'placed' }
  if ('Raised' in action) return { kind: 'Raised', label: 'Subió', tone: 'raised' }
  if ('Lowered' in action) return { kind: 'Lowered', label: 'Bajó', tone: 'lowered' }
  if ('Removed' in action) return { kind: 'Removed', label: 'Eliminado', tone: 'removed' }
  if ('Swapped' in action) return { kind: 'Swapped', label: 'Intercambio', tone: 'swapped' }
  if ('MovedToLegacy' in action) return { kind: 'MovedToLegacy', label: 'A legacy', tone: 'legacy' }
  if ('MovedFromLegacy' in action) return { kind: 'MovedFromLegacy', label: 'Desde legacy', tone: 'legacy' }
  return { kind: 'Unknown', label: 'Cambio', tone: 'unknown' }
}

const statusLabel = (status: string): string =>
  status === 'Legacy' ? 'lista legacy' : status === 'Removed' ? 'lista de eliminados' : ''

function EntryText({ entry }: { entry: ChangelogEntry }) {
  const action = entry.action
  const levelName = entry.affected_level.name
  const name = <strong className="changelog-level-name">{levelName}</strong>

  const neighbours = (() => {
    const above = entry.level_above
    const below = entry.level_below
    if (!above || !below) return null
    return (
      <>
        , por encima de <span className="changelog-neighbour">{below.name}</span> y por debajo de{' '}
        <span className="changelog-neighbour">{above.name}</span>
      </>
    )
  })()

  if (action === 'Pending') {
    return <>{name} se añadió como pendiente.</>
  }

  if ('Placed' in action) {
    const status = statusLabel(action.Placed.status)
    return (
      <>
        {name} se colocó en el <span className="changelog-pos">#{action.Placed.new_position}</span>
        {status && ` (${status})`}.
      </>
    )
  }

  if ('Raised' in action) {
    return (
      <>
        {name} subió del <span className="changelog-pos">#{action.Raised.old_position}</span> al{' '}
        <span className="changelog-pos">#{action.Raised.new_position}</span>
        {neighbours}.
      </>
    )
  }

  if ('Lowered' in action) {
    return (
      <>
        {name} bajó del <span className="changelog-pos">#{action.Lowered.old_position}</span> al{' '}
        <span className="changelog-pos">#{action.Lowered.new_position}</span>
        {neighbours}.
      </>
    )
  }

  if ('Removed' in action) {
    const old = action.Removed.old_position
    return (
      <>
        {name} fue eliminado de la lista{old !== null ? <> (estaba en el <span className="changelog-pos">#{old}</span>)</> : null}.
      </>
    )
  }

  if ('Swapped' in action) {
    const { upper_position, upper_level, other_level } = action.Swapped
    return (
      <>
        <strong className="changelog-level-name">{upper_level.name}</strong> y{' '}
        <strong className="changelog-level-name">{other_level.name}</strong> se intercambiaron, quedando{' '}
        <strong className="changelog-level-name">{upper_level.name}</strong> por encima en el{' '}
        <span className="changelog-pos">#{upper_position}</span>.
      </>
    )
  }

  if ('MovedToLegacy' in action) {
    return (
      <>
        {name} pasó a la lista legacy, del <span className="changelog-pos">#{action.MovedToLegacy.old_position}</span> al{' '}
        <span className="changelog-pos">#{action.MovedToLegacy.new_position}</span>.
      </>
    )
  }

  if ('MovedFromLegacy' in action) {
    return (
      <>
        {name} salió de la lista legacy, del <span className="changelog-pos">#{action.MovedFromLegacy.old_position}</span> al{' '}
        <span className="changelog-pos">#{action.MovedFromLegacy.new_position}</span>.
      </>
    )
  }

  const unknown = action.Unknown
  return (
    <>
      {name} cambió de estado a {unknown.new_status}
      {typeof unknown.new_position === 'number' ? <> (<span className="changelog-pos">#{unknown.new_position}</span>)</> : null}.
    </>
  )
}

// Genera la lista de páginas mostrada: 1 2 … actual … últimas, como la web real.
function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 1) return [1]

  const wanted = new Set<number>([1, total, current])
  for (let offset = 1; offset <= 1; offset += 1) {
    if (current - offset >= 1) wanted.add(current - offset)
    if (current + offset <= total) wanted.add(current + offset)
  }
  if (total >= 3) wanted.add(2)
  if (total - 1 >= 1) wanted.add(total - 1)

  const sorted = [...wanted].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  let previous = 0
  sorted.forEach(page => {
    if (previous && page - previous > 1) result.push('gap')
    result.push(page)
    previous = page
  })
  return result
}

export function ChangelogSection() {
  const [mode, setMode] = useState<Mode>('classic')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ChangelogPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const result = await fetchChangelog(mode, page)
        if (cancelled) return
        setData(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mode, page])

  // Al cambiar de página o de lista, volvemos arriba de la sección.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [page, mode])

  const changeMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setPage(1)
  }

  // Agrupamos las entradas por día, igual que la web de la AREDL.
  const grouped: { key: string; entries: ChangelogEntry[] }[] = []
  if (data) {
    data.data.forEach(entry => {
      const key = dayKey(entry.created_at)
      const last = grouped[grouped.length - 1]
      if (last && last.key === key) last.entries.push(entry)
      else grouped.push({ key, entries: [entry] })
    })
  }

  const totalPages = data?.pages ?? 1
  const items = pageItems(page, totalPages)

  return (
    <section className="changelog-section">
      <div ref={topRef} />
      <div className="changelog-head">
        <h2 className="changelog-title">Changelog de la demonlist</h2>
        <div className="changelog-toggle">
          <button
            type="button"
            onClick={() => changeMode('classic')}
            className={`changelog-toggle-btn${mode === 'classic' ? ' is-active' : ''}`}
          >
            Clásico
          </button>
          <button
            type="button"
            onClick={() => changeMode('platformer')}
            className={`changelog-toggle-btn${mode === 'platformer' ? ' is-active' : ''}`}
          >
            Plataforma
          </button>
        </div>
      </div>

      {error && !data ? (
        <div className="changelog-error">
          <p>Error: {error}</p>
          <p className="changelog-error-hint">Comprueba tu conexión o la página de la AREDL.</p>
        </div>
      ) : (
        <>
          {grouped.length === 0 && loading ? (
            <div className="changelog-loading">
              <div className="changelog-spinner">⏳</div>
              <p>Cargando changelog...</p>
            </div>
          ) : (
            <div className={`changelog-list${loading ? ' is-loading' : ''}`}>
              {grouped.map(group => (
                <section key={group.key} className="changelog-day">
                  <h3 className="changelog-day-title">{formatDay(group.key)}</h3>
                  <ul className="changelog-entries">
                    {group.entries.map((entry, index) => {
                      const meta = actionMeta(entry)
                      return (
                        <li key={`${entry.affected_level.id}-${entry.created_at}-${index}`} className="changelog-entry">
                          <span className={`changelog-badge tone-${meta.tone}`}>{meta.label}</span>
                          <span className="changelog-entry-text">
                            <EntryText entry={entry} />
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <nav className="changelog-pagination" aria-label="Paginación del changelog">
            <button
              type="button"
              className="changelog-page-btn"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              title="Primera página"
            >
              «
            </button>
            <button
              type="button"
              className="changelog-page-btn"
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>

            {items.map((item, index) =>
              item === 'gap' ? (
                <span key={`gap-${index}`} className="changelog-page-gap">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`changelog-page-btn${item === page ? ' is-active' : ''}`}
                  onClick={() => setPage(item)}
                  disabled={item === page}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              className="changelog-page-btn"
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
            <button
              type="button"
              className="changelog-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              title="Última página"
            >
              »
            </button>

            {data && (
              <span className="changelog-page-info">
                Página {data.page} de {data.pages} · {data.count.toLocaleString('es-ES')} cambios
              </span>
            )}
          </nav>
        </>
      )}
    </section>
  )
}
