export interface RedisAccessTokensOptions {
  expiresIn: string | number
  prefix: string
  type: string
  tokenSecretLength: number
}

export interface StoredToken {
  tokenableId: string
  type: string
  name: string | null
  hash: string
  abilities: string[]
  createdAt: string
  expiresAt: string
}
