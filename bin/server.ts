// Point d'entrée du serveur HTTP

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core')

// URL de la racine de l'application, pour que AdonisJS retrouve ses fichiers et dossiers
const APP_ROOT = new URL('../', import.meta.url)

// Importe les fichiers de l'application (chemins relatifs à la racine) ou les paquets
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    // Les variables d'environnement sont validées avant le démarrage
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
