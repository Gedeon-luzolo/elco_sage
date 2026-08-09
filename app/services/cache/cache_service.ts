type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export default class CacheService {
  // Retourne la valeur du cache ou execute le loader si la cle est absente/expiree.
  async remember<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    // Evite de relancer une requete couteuse tant que la valeur est valide.
    const cached = this.get<T>(key)

    // Si la valeur est absente ou expiree, on execute le loader pour la recalculer et la stocker dans le cache.
    if (cached !== undefined) {
      return cached
    }

    const value = await loader()
    // On stocke la valeur dans le cache avec la duree de vie specifiee.
    this.set(key, value, ttlMs)

    return value
  }

  //Lit une valeur depuis le cache en tenant compte de son expiration.
  get<T>(key: string): T | undefined {
    const entry = store.get(key)

    // Si la valeur est absente ou expiree, on la supprime du cache et on retourne undefined.
    if (!entry) {
      return undefined
    }

    // Si la valeur est expiree, on la supprime du cache et on retourne undefined.
    if (entry.expiresAt <= Date.now()) {
      store.delete(key)
      return undefined
    }

    return entry.value as T
  }

  // Enregistre une valeur dans le cache pour une duree donnee.
  set<T>(key: string, value: T, ttlMs: number) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  // Supprime une cle precise du cache.
  forget(key: string) {
    store.delete(key)
  }

  //Supprime toutes les cles d'un domaine fonctionnel.
  forgetByPrefix(prefix: string) {
    // Les prefixes servent a invalider un domaine sans connaitre toutes ses cles.
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key)
      }
    }
  }

  // Vide completement le cache applicatif.
  flush() {
    store.clear()
  }
}
