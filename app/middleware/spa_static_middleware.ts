import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'

// Dossier du front compilé (copié dans le build par adonisrc.ts)
const DIST_PATH = app.makePath('web', 'dist')

// Les fichiers de /assets portent un hash dans leur nom : ils ne changent jamais
const IMMUTABLE = 'public, max-age=31536000, immutable'

// index.html, sw.js et le manifeste doivent être revalidés pour que la PWA se mette à jour
const REVALIDATE = 'no-cache'

type DistFile = { path: string; cacheControl: string }

// Index construit une seule fois : web/dist ne change pas pendant que le serveur tourne
let distIndex: Promise<Map<string, DistFile>> | undefined

// Liste les fichiers de web/dist, indexés par leur URL publique (/assets/app-123.js).
async function buildDistIndex() {
  const files = new Map<string, DistFile>()

  try {
    const entries = await readdir(DIST_PATH, { recursive: true, withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue
      }

      const path = join(entry.parentPath, entry.name)
      const url = '/' + relative(DIST_PATH, path).split(sep).join('/')

      files.set(url, {
        path,
        cacheControl: url.startsWith('/assets/') ? IMMUTABLE : REVALIDATE,
      })
    }
  } catch {
    // Pas de web/dist (développement avec Vite) : le middleware laisse tout passer
  }

  return files
}

// Décode l'URL sans lever d'erreur sur un encodage invalide (%E0...).
function safeDecode(url: string) {
  try {
    return decodeURIComponent(url)
  } catch {
    return null
  }
}

/**
 * Sert le front compilé avant le routage, sans passer par le bodyparser ni l'auth.
 * Les routes de la SPA (/sales, /stock...) reçoivent index.html ; /api est laissé au routeur.
 */
export default class SpaStaticMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const method = request.method()

    if (method !== 'GET' && method !== 'HEAD') {
      return next()
    }

    const pathname = safeDecode(request.url())

    // L'API garde ses propres réponses JSON, y compris ses 404
    if (!pathname || pathname === '/api' || pathname.startsWith('/api/')) {
      return next()
    }

    distIndex ??= buildDistIndex()
    const files = await distIndex

    // Un fichier avec extension (image, script) est servi tel quel ou laissé en 404 ;
    // une route sans extension est une route de la SPA
    const file = files.get(pathname) ?? (extname(pathname) ? undefined : files.get('/index.html'))

    if (!file) {
      return next()
    }

    response.header('Cache-Control', file.cacheControl)

    return response.download(file.path, true)
  }
}
