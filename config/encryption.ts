import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

const encryptionConfig = defineConfig({
  default: 'gcm',

  list: {
    gcm: drivers.aes256gcm({
      // La première clé chiffre, toutes les clés sont essayées pour déchiffrer
      keys: [env.get('APP_KEY')],
      id: 'gcm',
    }),
  },
})

export default encryptionConfig

// Types déduits des chiffreurs configurés
declare module '@adonisjs/core/types' {
  export interface EncryptorsList extends InferEncryptors<typeof encryptionConfig> {}
}
