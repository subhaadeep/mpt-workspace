export const VIDEO_STATUSES = [
  'Planned',
  'Scripted',
  'Edited',
  'Uploaded',
] as const

export type VideoStatus = typeof VIDEO_STATUSES[number]

export const ROLES = [
  'admin',
  'manager',
  'bot_user',
  'youtube_user',
  'full_user',
] as const

export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  bot_user: 'Bot User',
  youtube_user: 'YouTube User',
  full_user: 'Full User',
}
