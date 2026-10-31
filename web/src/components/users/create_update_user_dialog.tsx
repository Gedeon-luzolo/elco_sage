import type { FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { SubmitButton } from '~/components/common/submit_button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { OptionSelect } from '~/components/common/option_select'
import type { UserListItem, UserRole, UserSelectOption, UserStatus } from '~/types/user_types'

type UserDialogDefaultValues = Pick<UserListItem, 'fullName' | 'email' | 'role' | 'status'>

interface CreateUpdateUserDialogProps {
  title: string
  description: string
  open: boolean
  defaultValues: UserDialogDefaultValues
  submitLabel: string
  roleOptions: Array<UserSelectOption<UserRole>>
  statusOptions: Array<UserSelectOption<UserStatus>>
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isPending?: boolean
}

// Formulaire unique utilise pour creer et modifier un utilisateur.
export function CreateUpdateUserDialog({
  title,
  description,
  open,
  defaultValues,
  submitLabel,
  roleOptions,
  statusOptions,
  onOpenChange,
  onSubmit,
  isPending = false,
}: CreateUpdateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form key={`${title}-${defaultValues.email}`} className="grid gap-5" onSubmit={onSubmit}>
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
              <OptionSelect
                id={`${title}-role`}
                name="role"
                options={roleOptions}
                defaultValue={defaultValues.role}
              />
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor={`${title}-status`}>Statut du compte</Label>
              <OptionSelect
                id={`${title}-status`}
                name="status"
                options={statusOptions}
                defaultValue={defaultValues.status}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" size="lg" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <SubmitButton size="lg" label={submitLabel} isPending={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
