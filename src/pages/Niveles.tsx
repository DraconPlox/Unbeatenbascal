import { useEffect, useMemo, useRef, useState } from 'react'
import { aredlLevelUrl, aredlUserUrl, fetchClanLevelRecords, fetchLevels, fetchPlatformerLevels } from '../api/aredl'
import type { ListKey } from '../api/aredl'
import { ErrorState, LoadingState } from '../components/PageState'
import { useClan } from '../context/ClanContext'
import type { ClanLevelRecord, Level } from '../objects'
import { MOBILE_SYMBOL, VIDEO_SYMBOL, formatPoints, formatRecordDate } from '../utils/format'

const formatEdelEnjoyment = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A'
  return value % 1 === 0 ? value.toString() : value.toFixed(2)
}
const formatGDDLTier = (value: number | null | undefined) => value !== null && value !== undefined ? Math.ceil(value).toString() : 'N/A'

// completion_time llega en milisegundos.
const formatRecordTime = (milliseconds: number) => {
  const totalSeconds = Math.round(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

const labelStyle = { fontWeight: 600, color: '#374151' }

type SortType = 'aredl' | 'edel' | 'none'
type SortDir = 'asc' | 'desc'
type ListType = 'main' | 'pending'
type Mode = 'classic' | 'platformer'

const listKeyForMode = (mode: Mode): ListKey => (mode === 'platformer' ? 'arepl' : 'aredl')

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.6rem',
  borderRadius: '4px',
  border: '1px solid #d1d5db',
  background: 'white',
  color: '#111827',
  fontSize: '0.875rem',
  width: '80px',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '1rem',
}

const sectionLabelStyle: React.CSSProperties = {
  ...labelStyle,
  fontSize: '0.8rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
  display: 'block',
}

function searchMatches(query: string, name: string): boolean {
  const q = query.trim().toLowerCase()
  const n = name.toLowerCase()
  if (!q) return true
  if (q.startsWith('^')) return n.startsWith(q.slice(1))
  if (q.endsWith('$')) return n.endsWith(q.slice(0, -1))
  if (q.startsWith('^') && q.endsWith('$')) return n.startsWith(q.slice(1, -1)) && n.endsWith(q.slice(1, -1))
  return n.includes(q)
}

const sortLevels = (levels: Level[], sortType: SortType, sortDir: SortDir): Level[] => {
  if (sortType === 'none') return levels
  return [...levels].sort((a, b) => {
    let va: number | null, vb: number | null
    if (sortType === 'aredl') { va = a.position; vb = b.position }
    else { va = a.edel_enjoyment; vb = b.edel_enjoyment }

    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1

    return sortDir === 'asc' ? va - vb : vb - va
  })
}

export function Niveles() {
  const { classic: classicProfile, platformer: platformerProfile, reload: reloadProfiles } = useClan()
  const [mainLevels, setMainLevels] = useState<Level[]>([])
  const [pendingLevels, setPendingLevels] = useState<Level[]>([])
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([])
  const [platformerPendingLevels, setPlatformerPendingLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [levelsRetry, setLevelsRetry] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [platformerError, setPlatformerError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('classic')
  const [listType, setListType] = useState<ListType>('main')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState<SortType>('aredl')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [groupByNlw, setGroupByNlw] = useState(false)
  const [selectedNlwTiers, setSelectedNlwTiers] = useState<Set<string>>(new Set())
  const [posMin, setPosMin] = useState('')
  const [posMax, setPosMax] = useState('')
  const [edelMin, setEdelMin] = useState('')
  const [edelMax, setEdelMax] = useState('')
  const [gddlMin, setGddlMin] = useState('')
  const [gddlMax, setGddlMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Número de récords del clan por nivel, con clave `${list}:${level.id}`.
  // Sale del perfil de clan que carga ClanProvider al abrir la aplicación.
  const clanCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    classicProfile.data?.records.forEach(record => {
      counts[`aredl:${record.level.id}`] = record.completion_count
    })
    platformerProfile.data?.records.forEach(record => {
      counts[`arepl:${record.level.id}`] = record.completion_count
    })
    return counts
  }, [classicProfile.data, platformerProfile.data])

  const [detailRecords, setDetailRecords] = useState<ClanLevelRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const recordsCache = useRef(new Map<string, ClanLevelRecord[]>())

  useEffect(() => {
    const loadLevels = async () => {
      setLoading(true)
      const [classic, platformer] = await Promise.allSettled([
        (async () => {
          const [main, pending] = await Promise.all([
            fetchLevels(true),
            fetchLevels(false),
          ])
          return { main, pending: pending.filter(l => l.status.toLowerCase() === 'pending') }
        })(),
        (async () => {
          const [main, pending] = await Promise.all([
            fetchPlatformerLevels(true),
            fetchPlatformerLevels(false),
          ])
          return { main, pending: pending.filter(l => l.status.toLowerCase() === 'pending') }
        })(),
      ])

      if (classic.status === 'fulfilled') {
        setMainLevels(classic.value.main)
        setPendingLevels(classic.value.pending)
        setError(null)
      } else {
        setError(classic.reason instanceof Error ? classic.reason.message : 'Error desconocido')
      }

      if (platformer.status === 'fulfilled') {
        setPlatformerLevels(platformer.value.main)
        setPlatformerPendingLevels(platformer.value.pending)
        setPlatformerError(null)
      } else {
        setPlatformerError(platformer.reason instanceof Error ? platformer.reason.message : 'Error desconocido')
      }

      setLoading(false)
    }
    loadLevels()
  }, [levelsRetry])

  const activeLevels = mode === 'platformer'
    ? (listType === 'main' ? platformerLevels : platformerPendingLevels)
    : (listType === 'main' ? mainLevels : pendingLevels)

  const activeError = mode === 'platformer' ? platformerError : error
  const activeProfile = mode === 'platformer' ? platformerProfile : classicProfile
  const isPlatformer = mode === 'platformer'
  const uniqueNlwTiers = useMemo(() => {
    const tiers = new Set<string>()
    activeLevels.forEach(l => { if (l.nlw_tier) tiers.add(l.nlw_tier) })
    return [...tiers].sort()
  }, [activeLevels])

  const filtered = useMemo(() => {
    let result = activeLevels.filter(l => searchMatches(searchQuery, l.name))

    if (selectedNlwTiers.size > 0) {
      result = result.filter(l => l.nlw_tier && selectedNlwTiers.has(l.nlw_tier))
    }

    if (posMin !== '') result = result.filter(l => l.position !== null && l.position >= Number(posMin))
    if (posMax !== '') result = result.filter(l => l.position !== null && l.position <= Number(posMax))
    if (edelMin !== '') result = result.filter(l => l.edel_enjoyment !== null && l.edel_enjoyment >= Number(edelMin))
    if (edelMax !== '') result = result.filter(l => l.edel_enjoyment !== null && l.edel_enjoyment <= Number(edelMax))
    if (gddlMin !== '') result = result.filter(l => l.gddl_tier !== null && Math.ceil(l.gddl_tier) >= Number(gddlMin))
    if (gddlMax !== '') result = result.filter(l => l.gddl_tier !== null && Math.ceil(l.gddl_tier) <= Number(gddlMax))

    return sortLevels(result, sortType, sortDir)
  }, [activeLevels, searchQuery, sortType, sortDir, selectedNlwTiers, posMin, posMax, edelMin, edelMax, gddlMin, gddlMax])

  const grouped = useMemo(() => {
    if (!groupByNlw) return null
    const groups = new Map<string, Level[]>()
    filtered.forEach(l => {
      const tier = l.nlw_tier ?? 'Sin tier'
      if (!groups.has(tier)) groups.set(tier, [])
      groups.get(tier)!.push(l)
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, groupByNlw])

  // Nivel mostrado en el panel de detalle. Si el seleccionado no está en la
  // lista filtrada (por cambio de modo, filtro, etc.) se muestra el primero.
  const selected = useMemo(
    () => filtered.find(l => l.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  // Los récords completos del clan se piden solo para el nivel abierto.
  useEffect(() => {
    if (!selected) {
      setDetailRecords([])
      setRecordsError(null)
      setRecordsLoading(false)
      return
    }

    const cacheKey = `${listKeyForMode(mode)}:${selected.id}`
    const cached = recordsCache.current.get(cacheKey)
    if (cached) {
      setDetailRecords(cached)
      setRecordsError(null)
      setRecordsLoading(false)
      return
    }

    let cancelled = false
    setDetailRecords([])
    setRecordsError(null)
    setRecordsLoading(true)

    fetchClanLevelRecords(listKeyForMode(mode), selected.id)
      .then(records => {
        if (cancelled) return
        recordsCache.current.set(cacheKey, records)
        setDetailRecords(records)
      })
      .catch(err => {
        if (cancelled) return
        setRecordsError(err instanceof Error ? err.message : 'Error desconocido')
      })
      .finally(() => {
        if (!cancelled) setRecordsLoading(false)
      })

    return () => { cancelled = true }
  }, [mode, selected])

  const toggleNlwTier = (tier: string) => {
    setSelectedNlwTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  const clearFilters = () => {
    setSelectedNlwTiers(new Set())
    setPosMin('')
    setPosMax('')
    setEdelMin('')
    setEdelMax('')
    setGddlMin('')
    setGddlMax('')
    setGroupByNlw(false)
    setSortType('aredl')
    setSortDir('asc')
  }

  const renderStat = (label: string, value: string) => (
    <div className="demonlist-stat">
      <div className="demonlist-stat-label">{label}</div>
      <div className="demonlist-stat-value">{value}</div>
    </div>
  )

  const renderRow = (level: Level) => {
    const clanRecordCount = clanCounts[`${listKeyForMode(mode)}:${level.id}`] ?? 0

    return (
      <button
        key={level.id}
        type="button"
        onClick={() => setSelectedId(level.id)}
        className={`demonlist-row${selected?.id === level.id ? ' is-selected' : ''}`}
      >
        <span className="demonlist-row-pos">#{level.position}</span>
        <span className="demonlist-row-name">{level.name}</span>
        {clanRecordCount > 0 && (
          <span
            className="demonlist-row-records"
            title={`${clanRecordCount} ${clanRecordCount === 1 ? 'récord' : 'récords'} del clan`}
          >
            {clanRecordCount}
          </span>
        )}
        <span className="demonlist-row-points">{formatPoints(level.points)}</span>
      </button>
    )
  }

  const renderDetail = (level: Level) => {
    const tags = level.tags.filter((tag): tag is string => Boolean(tag))
    const sortedRecords = [...detailRecords].sort((a, b) => {
      const dateA = new Date(a.achieved_at ?? a.created_at).getTime()
      const dateB = new Date(b.achieved_at ?? b.created_at).getTime()
      return dateA - dateB
    })

    return (
      <div className="demonlist-detail">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>#{level.position}</span>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            <a
              className="demonlist-level-link"
              href={aredlLevelUrl(level.level_id, listKeyForMode(mode))}
              target="_blank"
              rel="noreferrer"
              title={`Ver ${level.name} en la AREDL`}
            >
              {level.name}
            </a>
          </h2>
        </div>
        <p style={{ color: 'var(--color-dark-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>
          Level ID: {level.level_id}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {renderStat('Puntos', formatPoints(level.points))}
          {renderStat('Edel Enjoyment', formatEdelEnjoyment(level.edel_enjoyment))}
          {renderStat('GDDL Tier', formatGDDLTier(level.gddl_tier))}
          {renderStat('NLW Tier', level.nlw_tier ?? 'N/A')}
          {renderStat('Two Player', level.two_player ? 'Sí' : 'No')}
          {renderStat('Canción', level.song !== null ? String(level.song) : 'N/A')}
          {renderStat('Completed by User', level.completed_by_user ? 'Sí' : level.completed_by_user === false ? 'No' : 'N/A')}
        </div>

        {tags.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="demonlist-stat-label" style={{ marginBottom: '0.4rem' }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {tags.map(tag => (
                <span key={tag} className="demonlist-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <div className="demonlist-stat-label" style={{ marginBottom: '0.25rem' }}>Descripción</div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{level.description || 'N/A'}</p>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-dark-border)' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
            Récords del clan {recordsLoading ? '' : `(${detailRecords.length})`}
          </h3>
          {recordsLoading ? (
            <p className="demonlist-records-hint">Cargando récords del clan...</p>
          ) : recordsError ? (
            <p className="demonlist-records-hint demonlist-records-hint-error">
              No se pudieron cargar los récords del clan.
            </p>
          ) : sortedRecords.length === 0 ? (
            <p className="demonlist-records-hint">
              Ningún miembro del clan ha completado este nivel.
            </p>
          ) : (
            <ul className="demonlist-records-list">
              {sortedRecords.map(record => {
                const time = record.completion_time ? formatRecordTime(record.completion_time) : ''
                const date = formatRecordDate(record.achieved_at ?? record.created_at)
                const meta = [time, date].filter(Boolean).join(' · ')

                return (
                  <li key={record.id} className="demonlist-record">
                    <div className="demonlist-record-main">
                      <a
                        className="demonlist-record-user"
                        href={aredlUserUrl(record.submitted_by.id)}
                        target="_blank"
                        rel="noreferrer"
                        title={`Ver el perfil de ${record.submitted_by.global_name || record.submitted_by.username} en la AREDL`}
                      >
                        {record.submitted_by.global_name || record.submitted_by.username}
                      </a>
                      {meta && <span className="demonlist-record-meta">{meta}</span>}
                    </div>
                    <div className="demonlist-record-actions">
                      {record.mobile && (
                        <span className="demonlist-record-tag" title="Móvil" aria-label="Móvil">
                          {MOBILE_SYMBOL}
                        </span>
                      )}
                      {record.video_url && !record.hide_video && (
                        <a
                          className="demonlist-record-link"
                          href={record.video_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Vídeo"
                          aria-label="Vídeo"
                        >
                          {VIDEO_SYMBOL}
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )
  }

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'aredl', label: isPlatformer ? 'Rank' : 'AREDL Rank' },
    { value: 'edel', label: 'EDEL Enjoyment' },
  ]

  // La demonlist espera a tener sus niveles y los perfiles del clan (de AREDL
  // y AREPL) antes de mostrar el listado. Así los badges salen completos desde
  // el primer render.
  if (loading || classicProfile.loading || platformerProfile.loading) {
    return (
      <LoadingState
        title={loading ? 'Cargando demonlist...' : 'Cargando récords del clan...'}
        description={loading
          ? 'Obteniendo los niveles de la AREDL y la AREPL. Si tarda, comprueba tu conexión a Internet.'
          : 'Esperando los datos del clan desde la AREDL.'}
      />
    )
  }

  return (
    <div className="demonlist-page">
      <h1 style={{ margin: '0 0 0.5rem' }}>Demonlist</h1>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <button
          onClick={() => setMode('classic')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: mode === 'classic' ? '#5865F2' : 'transparent', color: mode === 'classic' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
        >
          Clásico
        </button>
        <button
          onClick={() => setMode('platformer')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: mode === 'platformer' ? '#5865F2' : 'transparent', color: mode === 'platformer' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
        >
          Plataforma
        </button>
      </div>

      {activeError ? (
        <ErrorState
          title="No se pudo cargar la demonlist"
          description="Comprueba tu conexión a Internet o el estado de la AREDL e inténtalo de nuevo."
          onRetry={() => setLevelsRetry(value => value + 1)}
        />
      ) : activeProfile.error ? (
        <ErrorState
          title="No se pudieron cargar los récords del clan"
          description="Los niveles están disponibles, pero los récords del clan no. Comprueba tu conexión con la AREDL e inténtalo de nuevo."
          onRetry={reloadProfiles}
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <button
              onClick={() => setListType('main')}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: listType === 'main' ? '#5865F2' : 'transparent', color: listType === 'main' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Principales
            </button>
            <button
              onClick={() => setListType('pending')}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: listType === 'pending' ? '#5865F2' : 'transparent', color: listType === 'pending' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Pending
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder='Buscar nivel... (^empieza | acaba$)'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#111827', fontSize: '0.95rem', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #374151', background: showFilters ? '#5865F2' : '#374151', color: 'white', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          {showFilters && (
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d1d5db' }}>Filtros</span>
                <button
                  onClick={clearFilters}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: '1px solid #6b7280', background: 'transparent', color: '#d1d5db', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Limpiar
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                <div style={sectionStyle}>
                  <span style={sectionLabelStyle}>Ordenar por</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {sortOptions.map(({ value, label }) => (
                      <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="sort"
                          checked={sortType === value}
                          onChange={() => { setSortType(value); setSortDir('asc') }}
                          style={{ accentColor: '#5865F2' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  {sortType !== 'none' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSortDir('asc')}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid #5865F2', background: sortDir === 'asc' ? '#5865F2' : 'transparent', color: sortDir === 'asc' ? 'white' : '#5865F2', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ↑ Asc
                      </button>
                      <button
                        onClick={() => setSortDir('desc')}
                        style={{ padding: '0.3rem 0.7rem', borderRadius: '4px', border: '1px solid #5865F2', background: sortDir === 'desc' ? '#5865F2' : 'transparent', color: sortDir === 'desc' ? 'white' : '#5865F2', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ↓ Desc
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'classic' && (
                  <>
                    <div style={sectionStyle}>
                      <span style={sectionLabelStyle}>Agrupar</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={groupByNlw}
                          onChange={e => setGroupByNlw(e.target.checked)}
                          style={{ accentColor: '#5865F2' }}
                        />
                        Group by NLW tiers
                      </label>
                    </div>

                    <div style={sectionStyle}>
                      <span style={sectionLabelStyle}>NLW Tiers</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {uniqueNlwTiers.map(tier => (
                          <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d1d5db', fontSize: '0.8rem', cursor: 'pointer', background: selectedNlwTiers.has(tier) ? '#5865F2' : '#2e303a', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            <input
                              type="checkbox"
                              checked={selectedNlwTiers.has(tier)}
                              onChange={() => toggleNlwTier(tier)}
                              style={{ accentColor: '#5865F2' }}
                            />
                            {tier}
                          </label>
                        ))}
                        {uniqueNlwTiers.length === 0 && <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>No hay tiers</span>}
                      </div>
                    </div>
                  </>
                )}

                <div style={sectionStyle}>
                  <span style={sectionLabelStyle}>Posición</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
                    <input type="number" placeholder="Min" value={posMin} onChange={e => setPosMin(e.target.value)} style={inputStyle} />
                    <span>—</span>
                    <input type="number" placeholder="Max" value={posMax} onChange={e => setPosMax(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={sectionStyle}>
                  <span style={sectionLabelStyle}>EDEL Enjoyment</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
                    <input type="number" step="0.1" placeholder="Min" value={edelMin} onChange={e => setEdelMin(e.target.value)} style={inputStyle} />
                    <span>—</span>
                    <input type="number" step="0.1" placeholder="Max" value={edelMax} onChange={e => setEdelMax(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={sectionStyle}>
                  <span style={sectionLabelStyle}>GDDL Tier</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
                    <input type="number" placeholder="Min" value={gddlMin} onChange={e => setGddlMin(e.target.value)} style={inputStyle} />
                    <span>—</span>
                    <input type="number" placeholder="Max" value={gddlMax} onChange={e => setGddlMax(e.target.value)} style={inputStyle} />
                  </div>
                </div>

              </div>
            </div>
          )}

        </>
      )}

      {!activeError && (
        <div className="demonlist-layout">
          <div className="demonlist-list">
            {grouped ? (
              grouped.map(([tier, tierLevels]) => (
                <div key={tier}>
                  <div className="demonlist-group">{tier} ({tierLevels.length})</div>
                  {tierLevels.map(renderRow)}
                </div>
              ))
            ) : (
              filtered.map(renderRow)
            )}
            {filtered.length === 0 && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No se encontraron niveles</p>
            )}
          </div>

          {selected && renderDetail(selected)}
        </div>
      )}
    </div>
  )
}
