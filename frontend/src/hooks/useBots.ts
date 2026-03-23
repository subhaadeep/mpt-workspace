import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useBots() {
  return useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/api/bots').then((r) => r.data),
  })
}

export function useBot(id: number) {
  return useQuery({
    queryKey: ['bot', id],
    queryFn: () => api.get(`/api/bots/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateBot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; tags?: string }) =>
      api.post('/api/bots', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })
}

export function useDeleteBot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/bots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })
}
