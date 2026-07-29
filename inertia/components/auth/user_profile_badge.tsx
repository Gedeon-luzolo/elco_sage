import { ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '~/lib/utils'
import { type Data } from '@generated/data'

interface UserProfileBadgeProps {
  user: Data.User
  className?: string
  showRole?: boolean
}

export function UserProfileBadge({ user, className, showRole = true }: UserProfileBadgeProps) {
  const displayName = user.fullName || user.email

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-left backdrop-blur-md',
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
        <UserRound className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="max-w-56 truncate text-sm font-semibold text-white">{displayName}</p>
        <p className="max-w-56 truncate text-xs text-white/70">{user.email}</p>
      </div>
      {showRole && (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
          <ShieldCheck className="size-3.5" />
          {user.role}
        </div>
      )}
    </div>
  )
}
