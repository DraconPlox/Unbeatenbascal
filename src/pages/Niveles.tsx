import { Link, useLoaderData } from 'react-router-dom'
import type { Level } from '../objects'

export async function loader() {
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

export function Niveles() {
  const levels = useLoaderData() as Level[]
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Niveles</h1>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
        {levels.map((level) => (
          <div key={level.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
            <p><strong>Posición:</strong> #{level.position}</p>
            <p><strong>Nombre:</strong> {level.name}</p>
            <p><strong>ID:</strong> {level.id}</p>
            <p><strong>Puntos:</strong> {level.points}</p>
            <p><strong>Estado:</strong> {level.status}</p>
            <p><strong>Level ID:</strong> {level.level_id}</p>
            <p><strong>Two Player:</strong> {level.two_player ? 'Sí' : 'No'}</p>
            <p><strong>Tags:</strong> {level.tags.join(', ')}</p>
            <p><strong>Descripción:</strong> {level.description}</p>
            <p><strong>Canción:</strong> {level.song ?? 'N/A'}</p>
            <p><strong>Edel Enjoyment:</strong> {level.edel_enjoyment ?? 'N/A'}</p>
            <p><strong>GDDL Tier:</strong> {level.gddl_tier ?? 'N/A'}</p>
            <p><strong>NLW Tier:</strong> {level.nlw_tier ?? 'N/A'}</p>
            <p><strong>Completed by User:</strong> {level.completed_by_user ? 'Sí' : level.completed_by_user === false ? 'No' : 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}