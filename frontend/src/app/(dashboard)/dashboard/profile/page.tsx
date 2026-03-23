'use client'
import { useAuthStore } from '@/store/authStore'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ROLE_LABELS } from '@/lib/constants'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div>
      <TopBar title="Profile" />
      <div className="p-6 max-w-lg">
        <Card>
          <CardHeader><CardTitle>Your Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Role:</span>
              <Badge variant="blue">{ROLE_LABELS[user.role] ?? user.role}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={user.is_active ? 'green' : 'red'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
