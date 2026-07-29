import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { UserListItem, UserRole, UserSelectOption, UserStatus } from '~/user_types'

type UserDialogDefaultValues = Pick<UserListItem, 'fullName' | 'email' | 'role' | 'status'>

interface CreateUpdateUserDialogProps {
  title: string
  description: string
  open: boolean
  defaultValues: UserDialogDefaultValues
  processing: boolean
  submitLabel: string
  roleOptions: Array<UserSelectOption<UserRole>>
  statusOptions: Array<UserSelectOption<UserStatus>>
  onOpenChange: (open: boolean) => void
  action: (formData: FormData) => void | Promise<void>
}

// Formulaire unique utilise pour creer et modifier un utilisateur.
export function CreateUpdateUserDialog({
  title,
  description,
  open,
  defaultValues,
  processing,
  submitLabel,
  roleOptions,
  statusOptions,
  onOpenChange,
  action,
}: CreateUpdateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form key={`${title}-${defaultValues.email}`} className="grid gap-5" action={action}>
          <div className="grid gap-2">
            <Label htmlFor={`${title}-fullName`}>Nom complet</Label>
            <Input
              id={`${title}-fullName`}
              name="fullName"
              className="h-10 px-3"
              defaultValue={defaultValues.fullName ?? ''}
              placeholder="Nom complet"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${title}-email`}>Email</Label>
            <Input
              id={`${title}-email`}
              name="email"
              type="email"
              className="h-10 px-3"
              defaultValue={defaultValues.email}
              placeholder="email@exemple.com"
              required
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="grid flex-1 gap-2">
              <Label htmlFor={`${title}-role`}>Role</Label>
              <Select id={`${title}-role`} name="role" defaultValue={defaultValues.role}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor={`${title}-status`}>Statut</Label>
              <Select id={`${title}-status`} name="status" defaultValue={defaultValues.status}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" size="lg" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="submit" size="lg" disabled={processing}>
              {processing ? 'Traitement...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
