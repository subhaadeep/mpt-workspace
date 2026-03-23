import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Bot {
  id: number
  name: string
  description: string
  tags: string[]
  created_at: string
  owner_id: number
}

export interface BotVersion {
  id: number
  bot_id: number
  version_label: string
  notes: string
  created_at: string
}

export function useBots() {
  return useQuery<Bot[]>({
    queryKey: ['bots'],
    queryFn: async () => (await api.get('/api/bots')).data,
  })
}

export function useBot(id: number) {
  return useQuery<Bot>({
    queryKey: ['bots', id],
    queryFn: async () => (await api.get(`/api/bots/${id}`)).data,
    enabled: !!id,
  })
}

export function useBotVersions(botId: number) {
  return useQuery<BotVersion[]>({
    queryKey: ['bot-versions', botId],
    queryFn: async () => (await api.get(`/api/bots/${botId}/versions`)).data,
    enabled: !!botId,
  })
}

export function useCreateBot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description: string; tags: string[] }) =>
      api.post('/api/bots', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })
}

export function useCreateBotVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ botId, ...data }: { botId: number; version_label: string; notes: string }) =>
      api.post(`/api/bots/${botId}/versions`, data).then((r) => r.data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['bot-versions', v.botId] }),
  })
}

export function useDeleteBot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/bots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })
}
