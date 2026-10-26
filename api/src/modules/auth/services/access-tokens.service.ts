import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Redis } from 'ioredis';
import { REDIS } from '../../../common/redis/redis.module.js';

// Préfixes Redis : un enregistrement par token, plus un index par utilisateur pour tout révoquer.
const TOKEN_KEY = 'auth:token:';
const USER_TOKENS_KEY = 'auth:user_tokens:';
const TOKEN_PREFIX = 'elco_';

// Longue durée de vie : la caisse doit rester utilisable hors ligne.
const TOKEN_TTL_SECONDS = 10 * 24 * 60 * 60;

type StoredToken = {
  userId: string;
  hash: string;
  createdAt: string;
  expiresAt: string;
};

// Le secret n'est jamais stocké, seulement son empreinte.
const hashSecret = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');

@Injectable()
export class AccessTokensService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * Émet un token pour un appareil. Sa valeur n'est visible qu'ici.
   */
  async create(userId: string) {
    const identifier = randomBytes(18).toString('base64url');
    const secret = randomBytes(30).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_SECONDS * 1000);

    const stored: StoredToken = {
      userId,
      hash: hashSecret(secret),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.redis
      .multi()
      .set(
        TOKEN_KEY + identifier,
        JSON.stringify(stored),
        'EX',
        TOKEN_TTL_SECONDS,
      )
      .sadd(USER_TOKENS_KEY + userId, identifier)
      .expire(USER_TOKENS_KEY + userId, TOKEN_TTL_SECONDS)
      .exec();

    return { value: `${TOKEN_PREFIX}${identifier}.${secret}`, expiresAt };
  }

  /**
   * Vérifie un token présenté par la SPA.
   * Retourne null s'il est mal formé, inconnu, expiré ou falsifié.
   */
  async verify(value: string) {
    const decoded = this.decode(value);

    if (!decoded) {
      return null;
    }

    const raw = await this.redis.get(TOKEN_KEY + decoded.identifier);

    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredToken;
    const expected = Buffer.from(stored.hash, 'hex');
    const actual = Buffer.from(hashSecret(decoded.secret), 'hex');

    // Comparaison à temps constant : le secret doit correspondre à l'empreinte enregistrée.
    if (
      !timingSafeEqual(actual, expected) ||
      new Date(stored.expiresAt) <= new Date()
    ) {
      return null;
    }

    return { identifier: decoded.identifier, userId: stored.userId };
  }

  /**
   * Révoque un token précis (déconnexion d'un appareil).
   */
  async delete(identifier: string) {
    const raw = await this.redis.get(TOKEN_KEY + identifier);

    if (!raw) {
      return;
    }

    const stored = JSON.parse(raw) as StoredToken;

    await this.redis
      .multi()
      .unlink(TOKEN_KEY + identifier)
      .srem(USER_TOKENS_KEY + stored.userId, identifier)
      .exec();
  }

  /**
   * Révoque tous les tokens d'un utilisateur (compte bloqué, désactivé ou supprimé).
   */
  async deleteAllForUser(userId: string) {
    const userKey = USER_TOKENS_KEY + userId;
    const identifiers = await this.redis.smembers(userKey);

    await this.redis.unlink(
      userKey,
      ...identifiers.map((identifier) => TOKEN_KEY + identifier),
    );
  }

  // Sépare l'identifiant du secret : « elco_<identifiant>.<secret> ».
  private decode(value: string) {
    if (!value.startsWith(TOKEN_PREFIX)) {
      return null;
    }

    const [identifier, secret] = value.slice(TOKEN_PREFIX.length).split('.');

    return identifier && secret ? { identifier, secret } : null;
  }
}
