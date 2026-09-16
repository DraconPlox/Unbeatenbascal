import { useEffect, useMemo, useState } from 'react'
import type { Level } from '../objects'

export async function fetchLevels(excludePending: boolean) {
  const storedUser = localStorage.getItem('aredl_user')
  const headers: Record<string, string> = {}
  
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      if (user.access_token) {
        headers.Authorization = `Bearer ${user.access_token}`
      }
    } catch {
      localStorage.removeItem('aredl_user')
    }
  }

  const params = new URLSearchParams({
    exclude_legacy: 'true',
    exclude_pending: excludePending.toString(),
    exclude_removed: 'true',
  })
  
  const response = await fetch(`https://api.aredl.net/v2/api/aredl/levels?${params}`, {
    headers,
  })
  if (!response.ok) {
    throw new Error('Failed to fetch levels')
  }
  return response.json() as Promise<Level[]>
}

const formatPoints = (points: number) => {
  const value = points / 10
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}
const formatEdelEnjoyment = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A'
  return value % 1 === 0 ? value.toString() : value.toFixed(2)
}
const formatGDDLTier = (value: number | null | undefined) => value !== null && value !== undefined ? Math.ceil(value).toString() : 'N/A'

const cardStyle = { border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#fafafa', color: '#111827' }
const labelStyle = { fontWeight: 600, color: '#374151' }

type SortType = 'aredl' | 'edel' | 'none'
type SortDir = 'asc' | 'desc'
type ListType = 'main' | 'pending'

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
  const [mainLevels, setMainLevels] = useState<Level[]>([])
  const [pendingLevels, setPendingLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listType, setListType] = useState<ListType>('main')

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

  useEffect(() => {
    const loadLevels = async () => {
      try {
        setLoading(true)
        const [main, pending] = await Promise.all([
          fetchLevels(true),
          fetchLevels(false),
        ])
        setMainLevels(main)
        setPendingLevels(pending.filter(l => l.status.toLowerCase() === 'pending'))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    loadLevels()
  }, [])

  const activeLevels = listType === 'main' ? mainLevels : pendingLevels

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

  const toggleNlwTier = (tier: string) => {
    setSelectedNlwTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  const renderCard = (level: Level) => (
    <div key={level.id} style={cardStyle}>
      <p><span style={labelStyle}>Posición:</span> #{level.position}</p>
      <p><span style={labelStyle}>Nombre:</span> {level.name}</p>
      <p><span style={labelStyle}>Puntos:</span> {formatPoints(level.points)}</p>
      <p><span style={labelStyle}>Level ID:</span> {level.level_id}</p>
      <p><span style={labelStyle}>Two Player:</span> {level.two_player ? 'Sí' : 'No'}</p>
      <p><span style={labelStyle}>Tags:</span> {level.tags.join(', ')}</p>
      <p><span style={labelStyle}>Descripción:</span> {level.description}</p>
      <p><span style={labelStyle}>Canción:</span> {level.song ?? 'N/A'}</p>
      <p><span style={labelStyle}>Edel Enjoyment:</span> {formatEdelEnjoyment(level.edel_enjoyment)}</p>
      <p><span style={labelStyle}>GDDL Tier:</span> {formatGDDLTier(level.gddl_tier)}</p>
      <p><span style={labelStyle}>NLW Tier:</span> {level.nlw_tier ?? 'N/A'}</p>
      <p><span style={labelStyle}>Completed by User:</span> {level.completed_by_user ? 'Sí' : level.completed_by_user === false ? 'No' : 'N/A'}</p>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p>Cargando niveles...</p>
        <p>Si tarda, comprueba tu conexión a Internet o la pagina de la AREDL.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Demonlist</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setListType('main')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: listType === 'main' ? '#5865F2' : 'transparent', color: listType === 'main' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
        >
          Principales ({mainLevels.length})
        </button>
        <button
          onClick={() => setListType('pending')}
          style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #5865F2', background: listType === 'pending' ? '#5865F2' : 'transparent', color: listType === 'pending' ? 'white' : '#c084fc', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
        >
          Pending ({pendingLevels.length})
        </button>
      </div>

      <input
        type="text"
        placeholder='Buscar nivel... (^empieza | acaba$)'
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#111827', fontSize: '0.95rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />

      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #374151', background: showFilters ? '#5865F2' : '#374151', color: 'white', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem' }}
      >
        {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
      </button>

      {showFilters && (
        <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

            <div style={sectionStyle}>
              <span style={sectionLabelStyle}>Ordenar por</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {([
                  ['aredl', 'AREDL Rank'],
                  ['edel', 'EDEL Enjoyment'],
                ] as const).map(([val, lbl]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sort"
                      checked={sortType === val}
                      onChange={() => { setSortType(val); setSortDir('asc') }}
                      style={{ accentColor: '#5865F2' }}
                    />
                    {lbl}
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

      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
        {listType === 'main' ? 'Principales' : 'Pending'}: mostrando {filtered.length} de {activeLevels.length} niveles
      </p>

      <div style={{ display: 'grid', gap: '1rem', maxWidth: '800px' }}>
        {grouped ? (
          grouped.map(([tier, tierLevels]) => (
            <div key={tier}>
              <h2 style={{ color: '#c084fc', fontSize: '1.1rem', marginBottom: '0.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.25rem' }}>
                {tier} ({tierLevels.length})
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {tierLevels.map(renderCard)}
              </div>
            </div>
          ))
        ) : (
          filtered.map(renderCard)
        )}
        {filtered.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No se encontraron niveles</p>
        )}
      </div>
    </div>
  )
}