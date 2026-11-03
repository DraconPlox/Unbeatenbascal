// Usuario que aparece dentro de un récord de clan.
export interface ClanRecordUser {
  id: string
  username: string
  global_name: string | null
  country: number | null
  discord_id: string
  discord_avatar: string | null
  discord_avatar_decoration: string | null
  featured_badge_code: string | null
}

// Nivel resumido que devuelve el perfil de clan.
export interface ClanRecordLevel {
  id: string
  name: string
  level_id: number
  two_player: boolean
  position: number | null
  points: number
  status: string
  requires_raw_footage: boolean
}

// Un registro por nivel dentro del perfil de clan. completion_count es el
// número de miembros del clan que se han pasado ese nivel.
export interface ClanProfileRecord {
  id: string
  level: ClanRecordLevel
  submitted_by: ClanRecordUser
  mobile: boolean
  video_url: string | null
  hide_video: boolean
  is_verification: boolean
  achieved_at: string | null
  created_at: string
  updated_at: string
  completion_count: number
}

export interface ClanProfile {
  records: ClanProfileRecord[]
}

// Récord individual que devuelve el endpoint de un nivel concreto. Incluye a
// todos los victors del clan, no solo al primero. completion_time va en ms.
export interface ClanLevelRecord {
  id: string
  submitted_by: ClanRecordUser
  mobile: boolean
  video_url: string | null
  hide_video: boolean
  completion_time?: number | null
  achieved_at?: string | null
  created_at: string
  updated_at: string
}
