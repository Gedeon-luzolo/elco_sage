import { router } from '@inertiajs/react'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { ConfirmationDialog } from '~/components/ui/confirmation_dialog'
import { StatCard } from '~/components/common/stat_card'
import { PageHeader } from '~/components/common/page_header'
import { EmptyState } from '~/components/common/empty_state'
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
} from '~/types/user_types'
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

  // Memoize les cartes de stats pour eviter de recalculer a chaque rendu.
  const statCards = [
    { label: 'Total', value: stats.total },
    ...statusDistribution.map((item: UserStatusDistribution) => ({
      label: USER_STATUS_LABELS[item.status],
      value: item.total,
    })),
  ]

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
    const payload = { ...getUserFormPayload(formData) }
    const options = { preserveScroll: true, onSuccess: closeDialogs }

    if (editingUser) {
      router.put(`/management/users/${editingUser.id}`, payload, options)
    } else {
      router.post('/management/users', payload, options)
    }
  }

  // Supprime le compte apres confirmation explicite.
  const confirmDelete = () => {
    if (!deletingUser) return

    router.delete(`/management/users/${deletingUser.id}`, {
      preserveScroll: true,
      onSuccess: closeDialogs,
    })
  }

  return (
    <ManagementLayout title="Gestion des utilisateurs">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Gestion des utilisateurs"
          description="Les 30 comptes les plus recents sont affiches."
          icon={Users}
        >
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Creer
          </Button>
        </PageHeader>

        <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </section>

        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun utilisateur trouvé"
            description="Il n'y a aucun compte utilisateur enregistré ou correspondant."
          />
        ) : (
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
        )}
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
        title="Supprimer l'utilisateur"
        description={`Etes-vous sur de vouloir supprimer ${deletingUser?.fullName} ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        variant="destructive"
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
