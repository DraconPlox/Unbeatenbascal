// Tipos del changelog de la AREDL.
// Documentación: https://api.aredl.net/v2/docs#get-/api/aredl/changelog

export interface ChangelogLevel {
  id: string
  name: string
  level_id: number
  two_player: boolean
}

export type ChangelogLevelStatus = 'Pending' | 'MainList' | 'Legacy' | 'Removed'

export interface ChangelogPositionChange {
  new_position: number
  old_position: number
}

// "action" puede ser un string simple ("Pending") o un objeto con una sola
// clave que indica el tipo de cambio (Raised, Lowered, Swapped, ...).
export type ChangelogAction =
  | 'Pending'
  | { Placed: { new_position: number; status: ChangelogLevelStatus } }
  | { Raised: ChangelogPositionChange }
  | { Lowered: ChangelogPositionChange }
  | { Removed: { old_position: number | null } }
  | { Swapped: { upper_position: number; upper_level: ChangelogLevel; other_level: ChangelogLevel } }
  | { MovedToLegacy: ChangelogPositionChange }
  | { MovedFromLegacy: ChangelogPositionChange }
  | {
      Unknown: {
        new_position?: number | null
        old_position?: number | null
        old_status?: ChangelogLevelStatus | null
        new_status: ChangelogLevelStatus
      }
    }

export interface ChangelogEntry {
  action: ChangelogAction
  created_at: string
  affected_level: ChangelogLevel
  level_above: ChangelogLevel | null
  level_below: ChangelogLevel | null
}

export interface ChangelogPage {
  page: number
  per_page: number
  pages: number
  count: number
  data: ChangelogEntry[]
}
