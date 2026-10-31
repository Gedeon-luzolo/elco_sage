import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SubmitButton } from '~/components/common/submit_button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { USER_ROLE_LABELS } from '~/constants/users'
import { useCrud } from '~/hooks/common/useCrud'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import type { UserDTO } from '~/types/dto'
import { getUserInitials } from '~/utils/user.utils'

interface ProfileSheetProps {
  user: UserDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

// Longueur minimale imposée par l'API.
const MIN_PASSWORD_LENGTH = 8

// Tiroir du profil : identité de l'utilisateur et changement de son mot de passe.
export function ProfileSheet({ user, open, onOpenChange }: ProfileSheetProps) {
  const isOnline = useOnlineStatus()
  // Erreur de saisie détectée avant l'envoi (confirmation différente).
  const [formError, setFormError] = useState<string | null>(null)
  // Change à chaque succès pour vider le formulaire.
  const [formKey, setFormKey] = useState(0)

  const { useAction } = useCrud<UserDTO>({ endpoint: '/auth' })
  const changePassword = useAction<ChangePasswordPayload>({
    method: 'patch',
    path: () => '/auth/password',
    body: (payload) => payload,
    successMessage: 'Mot de passe modifié. Vos autres appareils ont été déconnectés.',
  })

  const displayName = user.fullName ?? user.email

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const currentPassword = String(formData.get('currentPassword') ?? '')
    const newPassword = String(formData.get('newPassword') ?? '')

    // La confirmation est vérifiée ici : l'API ne reçoit que le nouveau mot de passe.
    if (newPassword !== formData.get('confirmPassword')) {
      setFormError('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }

    setFormError(null)
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setFormKey((key) => key + 1)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-lg font-semibold">Mon profil</SheetTitle>
          <SheetDescription>Vos informations et votre mot de passe.</SheetDescription>
        </SheetHeader>

        {/* Identité : lecture seule, gérée par la direction */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-primary text-lg font-semibold text-primary">
            {getUserInitials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{USER_ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <form
          key={formKey}
          className="flex min-h-0 flex-1 flex-col border-t border-border"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-2 font-medium">
              <KeyRound className="size-4 text-muted-foreground" />
              Changer le mot de passe
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-current-password">Mot de passe actuel</Label>
              <Input
                id="profile-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                className="h-10 px-3"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-new-password">Nouveau mot de passe</Label>
              <Input
                id="profile-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                className="h-10 px-3"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              <p className="text-xs text-muted-foreground">
                Au moins {MIN_PASSWORD_LENGTH} caractères.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="profile-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="h-10 px-3"
                minLength={MIN_PASSWORD_LENGTH}
                required
                aria-invalid={formError !== null}
                onChange={() => setFormError(null)}
              />
              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>

            {/* Le changement passe par le serveur : impossible hors ligne */}
            {!isOnline && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                Connexion requise pour changer le mot de passe.
              </p>
            )}
          </div>

          <SheetFooter className="border-t border-border">
            <SubmitButton
              type="submit"
              size="lg"
              disabled={!isOnline}
              isPending={changePassword.isPending}
              label="Changer le mot de passe"
              loadingLabel="Enregistrement..."
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
