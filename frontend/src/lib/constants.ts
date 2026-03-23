// YouTube 5-stage production pipeline
export const VIDEO_STATUSES = [
  'script',
  'raw_files',
  'editing',
  'thumbnail',
  'uploaded',
] as const

export type VideoStatus = typeof VIDEO_STATUSES[number]

export const STATUS_LABELS: Record<VideoStatus, string> = {
  script:     'Script',
  raw_files:  'Raw Files',
  editing:    'Editing',
  thumbnail:  'Thumbnail',
  uploaded:   'Uploaded',
}

export const STATUS_COLORS: Record<VideoStatus, { bg: string; text: string; border: string; dot: string }> = {
  script:    { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500'  },
  raw_files: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'    },
  editing:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'   },
  thumbnail: { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500'  },
  uploaded:  { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500' },
}

export const STATUS_NEXT: Record<VideoStatus, VideoStatus | null> = {
  script:    'raw_files',
  raw_files: 'editing',
  editing:   'thumbnail',
  thumbnail: 'uploaded',
  uploaded:  null,
}

export const ROLES = [
  'admin',
  'manager',
  'bot_user',
  'youtube_user',
  'full_user',
] as const

export type Role = typeof ROLES[number]

export const ROLE_LABELS: Record<string, string> = {
  admin:         'Admin',
  manager:       'Manager',
  bot_user:      'Bot User',
  youtube_user:  'YouTube User',
  full_user:     'Full User',
}
