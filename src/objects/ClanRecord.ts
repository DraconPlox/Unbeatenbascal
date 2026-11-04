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

// Información básica del clan que acompaña al perfil.
export interface ClanInfo {
  id: string
  global_name: string
  tag: string
  description: string | null
  created_at: string
  updated_at: string
}

// Posición y puntos del clan dentro de la lista correspondiente.
export interface ClanRank {
  rank: number | null
  extremes_rank: number | null
  hardest_rank: number | null
  level_points: number
  extremes: number
}

// Puntos que aporta cada miembro al clan. completed_levels cuenta todos los
// niveles que ha completado, aunque el perfil solo guarde un registro por nivel.
export interface ClanMemberPoints {
  member: ClanRecordUser
  completed_levels: number
  contributed_points: number
}

export interface ClanProfile {
  clan?: ClanInfo
  rank?: ClanRank
  records: ClanProfileRecord[]
  members_points?: ClanMemberPoints[]
}

// Récord individual del perfil de un usuario. El endpoint del perfil ya
// pertenece al usuario, así que no incluye submitted_by.
export interface ClanMemberRecord {
  id: string
  level: ClanRecordLevel
  mobile: boolean
  video_url: string | null
  hide_video: boolean
  is_verification: boolean
  achieved_at: string | null
  created_at: string
  updated_at: string
}

// Perfil resumido de un miembro del clan: solo los campos que usan las
// estadísticas y todos sus récords en la lista correspondiente.
export interface ClanMemberProfile {
  id: string
  username: string
  global_name: string | null
  country: number | null
  records: ClanMemberRecord[]
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
