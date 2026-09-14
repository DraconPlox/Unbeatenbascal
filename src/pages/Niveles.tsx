import { useEffect, useState } from 'react'
import type { Level } from '../objects'

export async function fetchLevels() {
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
  
  const response = await fetch('https://api.aredl.net/v2/api/aredl/levels', {
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
const formatEdelEnjoyment = (value: number | null | undefined) => value !== null && value !== undefined ? value.toFixed(2) : 'N/A'
const formatGDDLTier = (value: number | null | undefined) => value !== null && value !== undefined ? Math.ceil(value).toString() : 'N/A'

const cardStyle = { border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#fafafa', color: '#111827' }
const labelStyle = { fontWeight: 600, color: '#374151' }

export function Niveles() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLevels = async () => {
      try {
        setLoading(true)
        const data = await fetchLevels()
        setLevels(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    loadLevels()
  }, [])

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
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '800px' }}>
        {levels.map((level) => (
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
        ))}
      </div>
    </div>
  )
}