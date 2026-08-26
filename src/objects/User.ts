export interface User {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
  banner: string | null
  accent_color: string | null
  public_flags: number
  flags: number
  avatar_decoration_data: unknown | null
  collectibles: unknown | null
  primary_guild: unknown | null
  guild_member: unknown | null
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}