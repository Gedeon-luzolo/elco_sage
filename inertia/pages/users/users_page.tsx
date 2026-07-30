import { router } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { CreateUpdateUserDialog } from '~/components/users/create_update_user_dialog'
import { UserCard } from '~/components/users/user_card'
import {
  EMPTY_USER_FORM,
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
  USER_STATUS_LABELS,
  USER_STATUS_OPTIONS,
} from '~/constants/users'
import type {
  UserFormState,
  UserListItem,
  UsersPageProps,
  UserStatusDistribution,
} from '~/user_types'
import { ManagementLayout } from '~/layouts/management_layout'

// Transforme les donnees du formulaire en payload pour l'API.
function getUserFormPayload(formData: FormData): UserFormState {
  return {
    fullName: String(formData.get('fullName') || ''),
    email: String(formData.get('email') || ''),
    role: String(formData.get('role') || EMPTY_USER_FORM.role) as UserFormState['role'],
    status: String(formData.get('status') || EMPTY_USER_FORM.status) as UserFormState['status'],
  }
}

export default function UsersPage({ users, stats, statusDistribution }: UsersPageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)
  const [processing, setProcessing] = useState(false)

  // Memoize les cartes de stats pour eviter de recalculer a chaque rendu.
  const statCards = useMemo(
    () => [
      { label: 'Total', value: stats.total },
      ...statusDistribution.map((item: UserStatusDistribution) => ({
        label: USER_STATUS_LABELS[item.status],
        value: item.total,
      })),
    ],
    [stats.total, statusDistribution]
  )

  // Ouvre la modale en mode creation avec un formulaire propre.
  const openCreateDialog = () => {
    setEditingUser(null)
    setIsCreateOpen(true)
  }

  // Ouvre la meme modale en mode edition avec les valeurs du compte.
  const openEditDialog = (user: UserListItem) => {
    setIsCreateOpen(false)
    setEditingUser(user)
  }

  // Reinitialise toutes les modales utilisateur apres succes ou annulation.
  const closeDialogs = () => {
    setIsCreateOpen(false)
    setEditingUser(null)
    setDeletingUser(null)
  }

  // Envoie le formulaire vers la creation ou la modification selon le mode courant.
  const saveUser = (formData: FormData) => {
    setProcessing(true)

    const payload = { ...getUserFormPayload(formData) }

    // Crréer les options de navigation pour conserver le scroll et fermer les modales apres succes.
    const options = {
      preserveScroll: true,
      onSuccess: closeDialogs,
      onFinish: () => setProcessing(false),
    }

    // Si on est en edition, on envoie un PUT vers le compte existant, sinon un POST vers la collection.
    if (editingUser) {
      router.put(`/users/${editingUser.id}`, payload, options)
      return
    }

    // Creation d'un nouveau compte.
    router.post('/users', payload, options)
  }

  // Supprime le compte apres confirmation explicite.
  const confirmDelete = () => {
    if (!deletingUser) {
      return
    }

    setProcessing(true)

    router.delete(`/users/${deletingUser.id}`, {
      preserveScroll: true,
      onSuccess: closeDialogs,
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <ManagementLayout title="Gestion des utilisateurs">
      <section className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">
              Gestion des utilisateurs
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Les 30 comptes les plus recents sont affiches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Creer
            </Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} size="sm" className="bg-background">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              roleLabels={USER_ROLE_LABELS}
              statusLabels={USER_STATUS_LABELS}
              onEdit={openEditDialog}
              onDelete={setDeletingUser}
            />
          ))}
        </section>
      </section>

      <CreateUpdateUserDialog
        title={editingUser ? 'Modifier un utilisateur' : 'Creer un utilisateur'}
        description={
          editingUser
            ? "Ces changements affectent le profil et l'acces du compte."
            : 'Le mot de passe temporaire sera affiche apres creation.'
        }
        open={isCreateOpen || Boolean(editingUser)}
        defaultValues={editingUser ?? EMPTY_USER_FORM}
        processing={processing}
        submitLabel={editingUser ? 'Enregistrer' : 'Creer'}
        roleOptions={USER_ROLE_OPTIONS}
        statusOptions={USER_STATUS_OPTIONS}
        onOpenChange={(open) => {
          if (!open) {
            closeDialogs()
            return
          }

          setIsCreateOpen(true)
        }}
        action={saveUser}
      />

      <ConfirmationDialog
        open={Boolean(deletingUser)}
        title="Supprimer le compte"
        description={`Cette action supprimera definitivement le compte ${deletingUser?.email ?? ''}.`}
        confirmLabel="Supprimer"
        variant="destructive"
        processing={processing}
        onOpenChange={(open) => {
          if (!open) {
            closeDialogs()
          }
        }}
        onCancel={closeDialogs}
        onConfirm={confirmDelete}
      />
    </ManagementLayout>
  )
}
