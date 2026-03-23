import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { VideoStatus } from '@/lib/constants'

export interface VideoIdea {
  id: number
  title: string
  description: string
  status: VideoStatus
  script: string
  created_at: string
}

export function useVideoIdeas() {
  return useQuery<VideoIdea[]>({
    queryKey: ['videos'],
    queryFn: async () => (await api.get('/api/youtube/videos')).data,
  })
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      api.post('/api/youtube/videos', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<VideoIdea> & { id: number }) =>
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
