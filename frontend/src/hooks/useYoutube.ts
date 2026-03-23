import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: () => api.get('/api/youtube/videos').then((r) => r.data),
  })
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string; status?: string }) =>
      api.post('/api/youtube/videos', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; status?: string; script?: string }) =>
      api.patch(`/api/youtube/videos/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/youtube/videos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  })
}
