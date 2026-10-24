// Lot renvoyé par le serveur : les lignes demandées et la position du lot dans la liste complète.
export interface ServerBatchResponse<T> {
  items: T[]
  pagination: {
    offset: number
    limit: number
    totalItems: number
  }
}
