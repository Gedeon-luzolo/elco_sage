import type { RedisAccessTokensOptions, StoredToken } from '#types/auth'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import type { AccessTokensProviderContract } from '@adonisjs/auth/types/access_tokens'
import type { Secret } from '@adonisjs/core/helpers'
import string from '@adonisjs/core/helpers/string'
import redis from '@adonisjs/redis/services/main'
import type { LucidModel } from '@adonisjs/lucid/types/model'

// Préfixes Redis : un enregistrement par token, plus un index par utilisateur pour tout révoquer.
const TOKEN_KEY = 'auth:token:'
const USER_TOKENS_KEY = 'auth:user_tokens:'

/**
 * Stocke les tokens d'accès dans Redis à la place de la table auth_access_tokens.
 * Le format du token public (préfixe, identifiant, secret) reste celui d'Adonis :
 * le guard et le fournisseur d'utilisateurs fonctionnent sans changement.
 */
export default class RedisAccessTokensProvider<
  TokenableModel extends LucidModel,
> implements AccessTokensProviderContract<TokenableModel> {
  constructor(private options: RedisAccessTokensOptions) {}

  // Crée un token pour l'utilisateur et l'enregistre dans Redis avec sa durée de vie.
  async create(
    user: InstanceType<TokenableModel>,
    abilities: string[] = ['*'],
    options?: { name?: string; expiresIn?: string | number }
  ) {
    const userId = String(user.$primaryKeyValue)
    const identifier = string.random(32)
    const ttlSeconds = string.seconds.parse(options?.expiresIn ?? this.options.expiresIn)

    // Le secret n'est jamais stocké, seulement son hash
    const transient = AccessToken.createTransientToken(
      userId,
      this.options.tokenSecretLength,
      ttlSeconds
    )
    const now = new Date()

    const stored: StoredToken = {
      tokenableId: userId,
      type: this.options.type,
      name: options?.name ?? null,
      hash: transient.hash,
      abilities,
      createdAt: now.toISOString(),
      expiresAt: transient.expiresAt!.toISOString(),
    }

    await redis
      .multi()
      .set(TOKEN_KEY + identifier, JSON.stringify(stored), 'EX', ttlSeconds)
      .sadd(USER_TOKENS_KEY + userId, identifier)
      .expire(USER_TOKENS_KEY + userId, ttlSeconds)
      .exec()

    return new AccessToken({
      identifier,
      tokenableId: userId,
      type: stored.type,
      prefix: this.options.prefix,
      secret: transient.secret,
      name: stored.name,
      hash: stored.hash,
      abilities,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      expiresAt: transient.expiresAt!,
    })
  }

  // Vérifie un token présenté par la SPA. Retourne null s'il est inconnu, expiré ou falsifié.
  async verify(tokenValue: Secret<string>) {
    const decoded = AccessToken.decode(this.options.prefix, tokenValue.release())

    if (!decoded) {
      return null
    }

    const raw = await redis.get(TOKEN_KEY + decoded.identifier)

    if (!raw) {
      return null
    }

    const stored = JSON.parse(raw) as StoredToken

    const token = new AccessToken({
      identifier: decoded.identifier,
      tokenableId: stored.tokenableId,
      type: stored.type,
      name: stored.name,
      hash: stored.hash,
      abilities: stored.abilities,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.createdAt),
      // Pas de date de dernier usage : cela imposerait une écriture à chaque requête
      lastUsedAt: null,
      expiresAt: new Date(stored.expiresAt),
    })

    // Le secret doit correspondre au hash enregistré
    if (!token.verify(decoded.secret) || token.isExpired()) {
      return null
    }

    return token
  }

  // Révoque un token à partir de sa valeur publique.
  async invalidate(tokenValue: Secret<string>) {
    const decoded = AccessToken.decode(this.options.prefix, tokenValue.release())

    if (!decoded) {
      return false
    }

    return this.remove(String(decoded.identifier))
  }

  // Révoque un token précis d'un utilisateur (déconnexion d'un appareil).
  async delete(user: InstanceType<TokenableModel>, identifier: string | number | BigInt) {
    const raw = await redis.get(TOKEN_KEY + identifier)

    if (!raw) {
      return 0
    }

    // Un utilisateur ne peut révoquer que ses propres tokens
    const stored = JSON.parse(raw) as StoredToken

    if (stored.tokenableId !== String(user.$primaryKeyValue)) {
      return 0
    }

    return (await this.remove(String(identifier))) ? 1 : 0
  }

  // Révoque tous les tokens d'un utilisateur (compte bloqué, désactivé ou supprimé).
  async deleteAll(user: InstanceType<TokenableModel>) {
    const userKey = USER_TOKENS_KEY + String(user.$primaryKeyValue)
    const identifiers = await redis.smembers(userKey)

    if (identifiers.length === 0) {
      return 0
    }

    await redis.unlink(userKey, ...identifiers.map((identifier) => TOKEN_KEY + identifier))

    return identifiers.length
  }

  // Supprime l'enregistrement du token et sa référence dans l'index de son utilisateur.
  private async remove(identifier: string) {
    const raw = await redis.get(TOKEN_KEY + identifier)

    if (!raw) {
      return false
    }

    const stored = JSON.parse(raw) as StoredToken

    await redis
      .multi()
      .unlink(TOKEN_KEY + identifier)
      .srem(USER_TOKENS_KEY + stored.tokenableId, identifier)
      .exec()

    return true
  }
}
