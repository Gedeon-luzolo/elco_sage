import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  default: 'scrypt',

  list: {
    // scrypt est coûteux en mémoire, ce qui renchérit les attaques par force brute
    scrypt: drivers.scrypt({
      // Facteur de travail (puissance de deux) : plus il est haut, plus c'est sûr et lent
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      // Mémoire maximale en octets : le hachage échoue au-delà
      maxMemory: 33554432,
    }),
  },
})

export default hashConfig

// Types déduits des algorithmes de hachage configurés
declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
