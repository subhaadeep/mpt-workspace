import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then((r) => r.data),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; password: string; role: string; full_name?: string }) =>
      api.post('/api/admin/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
