import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '~/lib/api/fetch'
import { getErrorMessage } from '~/lib/error/get_error_message'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'

type Id = string | number

type QueryParams = Record<string, string | number | boolean | undefined>

// Options d'une ressource : son endpoint, les listes à recharger après une mutation
// (préfixes de clés ou clés exactes) et l'affichage du toast de succès.
type CrudOptions = {
  endpoint: string
  queryKey?: string
  invalidateQueries?: (string | readonly unknown[])[]
  showSuccessToast?: boolean
}

// Description d'une action sur une sous-route : méthode, chemin, corps et message de succès.
type ActionOptions<TVars> = {
  method?: 'post' | 'patch' | 'delete'
  path: (variables: TVars) => string
  body?: (variables: TVars) => unknown
  successMessage?: string
}

// Hook générique CRUD : lectures, création, modification, suppression et actions,
// avec toasts et invalidation du cache.
export function useCrud<T extends Record<string, unknown>>({
  endpoint,
  queryKey,
  invalidateQueries = [],
  showSuccessToast = true,
}: CrudOptions) {
  const queryClient = useQueryClient()
  const resourceKey = queryKey ?? endpoint

  // Affiche l'erreur d'une mutation en toast (les lectures s'affichent dans la page)
  const notifyError = (error: unknown) => {
    toast.error(getErrorMessage(error))
  }

  // Confirme en toast qu'une mutation a réussi
  const notifySuccess = (title: string) => {
    if (showSuccessToast) {
      toast.success(title)
    }
  }

  // Recharge les listes liées à la ressource
  const invalidateResource = () => {
    queryClient.invalidateQueries({ queryKey: [resourceKey] })

    // Les ressources liées sont rechargées par préfixe (texte) ou par clé exacte
    invalidateQueries.forEach((key) => {
      if (typeof key === 'string') {
        invalidateQueriesByPrefix(key)
        return
      }

      queryClient.invalidateQueries({ queryKey: key })
    })
  }

  // Récupère la liste simple
  const useList = (enabled = true) =>
    useQuery({
      queryKey: [resourceKey],
      queryFn: () => api.get<T[]>(endpoint),
      enabled,
    })

  // Récupère la liste avec filtres
  const useListWithParams = (params: QueryParams, enabled = true) =>
    useQuery({
      queryKey: [resourceKey, params],
      queryFn: () => api.get<T[]>(endpoint, { params }),
      enabled,
    })

  // Récupère une réponse qui n'est pas une liste (ex : { debts, stats }), avec filtres
  const useGetWithParams = <R = T>(params: QueryParams = {}, enabled = true) =>
    useQuery({
      queryKey: [resourceKey, params],
      queryFn: () => api.get<R>(endpoint, { params }),
      enabled,
    })

  // Récupère un élément par id
  const useGet = (id: Id, enabled = true) =>
    useQuery({
      queryKey: [resourceKey, id],
      queryFn: () => api.get<T>(`${endpoint}/${id}`),
      enabled,
    })

  // Crée un élément
  const useCreate = <TPayload = Omit<T, 'id'>, TResult = T>() =>
    useMutation({
      mutationFn: (payload: TPayload) => api.post<TResult>(endpoint, payload),
      onSuccess: () => {
        invalidateResource()
        notifySuccess('Création réussie.')
      },
      onError: notifyError,
    })

  // Modifie un élément (PATCH /ressource/:id)
  const usePatch = <TPayload = Partial<T>>() =>
    useMutation({
      mutationFn: ({ id, data }: { id: Id; data: TPayload }) =>
        api.patch<T>(`${endpoint}/${id}`, data),
      onSuccess: (_data, payload) => {
        // La fiche modifiée et les listes sont rechargées
        queryClient.invalidateQueries({ queryKey: [resourceKey, payload.id] })
        invalidateResource()
        notifySuccess('Modification réussie.')
      },
      onError: notifyError,
    })

  // Action sur une sous-route (ex : annuler une vente, encaisser une dette).
  // Invalide les mêmes ressources qu'une mutation CRUD classique.
  const useAction = <TVars = Id, TResult = unknown>(action: ActionOptions<TVars>) =>
    useMutation({
      mutationFn: (variables: TVars) => {
        const path = action.path(variables)
        const method = action.method ?? 'post'

        // La suppression n'envoie pas de corps
        if (method === 'delete') {
          return api.delete<TResult>(path)
        }

        return api[method]<TResult>(path, action.body?.(variables))
      },
      onSuccess: () => {
        invalidateResource()
        if (action.successMessage) notifySuccess(action.successMessage)
      },
      onError: notifyError,
    })

  // Supprime un élément
  const useDelete = () =>
    useMutation({
      mutationFn: (id: Id) => api.delete(`${endpoint}/${id}`),
      onSuccess: () => {
        invalidateResource()
        notifySuccess('Suppression réussie.')
      },
      onError: notifyError,
    })

  return {
    useList,
    useListWithParams,
    useGetWithParams,
    useGet,
    useCreate,
    usePatch,
    useAction,
    useDelete,
  }
}
