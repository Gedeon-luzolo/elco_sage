import { Edit3, Trash2, UserRound } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { UserListItem, UserRole, UserStatus } from '~/types/user_types'

interface UserCardProps {
  user: UserListItem
  roleLabels: Record<UserRole, string>
  statusLabels: Record<UserStatus, string>
  onEdit: (user: UserListItem) => void
  onDelete: (user: UserListItem) => void
}

// Card compacte pour scanner rapidement un utilisateur et ses actions.
export function UserCard({ user, roleLabels, statusLabels, onEdit, onDelete }: UserCardProps) {
  const status = user.status as UserStatus
  const role = user.role as UserRole

  return (
    <Card className="bg-background">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {user.fullName || 'Utilisateur sans nom'}
              </CardTitle>
              <CardDescription className="truncate">{user.email}</CardDescription>
            </div>
          </div>
          <Badge variant={status === 'BLOCKED' ? 'destructive' : 'secondary'}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{roleLabels[role]}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onEdit(user)}>
            <Edit3 className="size-4" />
            Modifier
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="Supprimer le compte"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
