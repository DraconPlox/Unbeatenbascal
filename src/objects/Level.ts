export interface Level {
  id: string
  name: string
  position: number | null
  publisher_id: string
  points: number
  status: string
  requires_raw_footage: boolean
  level_id: number
  two_player: boolean
  tags: (string | null)[]
  description: string | null
  song: number | null
  edel_enjoyment: number | null
  is_edel_pending: boolean
  gddl_tier: number | null
  nlw_tier: string | null
  completed_by_user: boolean | null
}