import type { ClanLevelRecord, ClanMemberProfile, ClanProfile, Level } from '../objects'

// Clan JEWBASCAL en AREDL.
export const CLAN_ID = '146a7fb4-a87a-42db-9795-3d46d3c74c8b'

export type ListKey = 'aredl' | 'arepl'

// Perfil público de un usuario en la web de la AREDL.
export const aredlUserUrl = (userId: string) => `https://aredl.net/profile/user/${userId}`

// Página de un nivel en la web de la AREDL. Usa el ID de Geometry Dash
// (level_id), no el UUID interno. Los niveles de plataforma necesitan el
// parámetro `list=platformer` para resolverse en la lista correcta.
export const aredlLevelUrl = (levelId: number, list: ListKey = 'aredl') =>
  `https://aredl.net/list/${levelId}${list === 'arepl' ? '?list=platformer' : ''}`

export function aredlAuthHeaders(): Record<string, string> {
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

  return headers
}

const levelParams = (excludePending: boolean) =>
  new URLSearchParams({
    exclude_legacy: 'true',
    exclude_pending: excludePending.toString(),
    exclude_removed: 'true',
  })

export async function fetchLevels(excludePending: boolean): Promise<Level[]> {
  const response = await fetch(`https://api.aredl.net/v2/api/aredl/levels?${levelParams(excludePending)}`, {
    headers: aredlAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch levels')
  }
  return response.json() as Promise<Level[]>
}

// Los niveles de plataforma viven en el endpoint AREPL de la AREDL.
// Gracias a exclude_legacy=true se descartan dinamicamente los que ya no son
// extreme demons, sin tener que hardcodear la cantidad de niveles.
export async function fetchPlatformerLevels(excludePending = true): Promise<Level[]> {
  const response = await fetch(`https://api.aredl.net/v2/api/arepl/levels?${levelParams(excludePending)}`, {
    headers: aredlAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch platformer levels')
  }
  return response.json() as Promise<Level[]>
}

// Perfil del clan: incluye los records por nivel, el rank y los puntos que
// aporta cada miembro.
export async function fetchClanProfile(list: ListKey): Promise<ClanProfile> {
  const response = await fetch(`https://api.aredl.net/v2/api/${list}/clan/${CLAN_ID}`, {
    headers: aredlAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch clan records')
  }
  return response.json() as Promise<ClanProfile>
}

// Perfil de un miembro con todos sus récords. El perfil del clan solo guarda
// al primer victor/verificador de cada nivel, así que este endpoint es el que
// permite ver los récords individuales (y los últimos enviados).
export async function fetchClanMemberProfile(
  list: ListKey,
  userId: string,
): Promise<ClanMemberProfile> {
  const response = await fetch(`https://api.aredl.net/v2/api/${list}/profile/${userId}`, {
    headers: aredlAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch member records')
  }
  return response.json() as Promise<ClanMemberProfile>
}

// Todos los victors del clan en un nivel (no solo el primero, como en el perfil).
export async function fetchClanLevelRecords(
  list: ListKey,
  levelId: string,
): Promise<ClanLevelRecord[]> {
  const response = await fetch(`https://api.aredl.net/v2/api/${list}/clan/${CLAN_ID}/levels/${levelId}/records`, {
    headers: aredlAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch clan level records')
  }
  return response.json() as Promise<ClanLevelRecord[]>
}
