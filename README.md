# Elco Sage

Application de caisse et de gestion d'un commerce de services à Kinshasa. Elle couvre la vente au comptant, à crédit ou offerte, en CDF et en USD, la caisse partagée (ouverture, clôture, écarts), les dettes et leurs recouvrements, le catalogue, les clients, les comptes et le pilotage de la direction (tableau de bord, productivité, journal).

La caisse continue de vendre **hors ligne** : les ventes et les paiements sont mis en file sur le poste, puis envoyés au retour du réseau.

## Structure

| Dossier | Rôle | Pile technique |
| --- | --- | --- |
| [`api/`](api) | API JSON sous `/api` | NestJS 12, TypeORM, PostgreSQL, Redis, Zod |
| [`web/`](web) | Application (SPA installable, hors ligne) | React 19, Vite, TanStack Query, Tailwind 4, Workbox |

Les deux projets sont indépendants : chacun a son `package.json`, son lockfile et ses commandes.

## Prérequis

- Node.js 24 ou plus récent
- pnpm
- PostgreSQL
- Redis

## Installation

### API

```bash
cd api
pnpm install
```

Créer `api/.env` (il n'est pas versionné) :

```dotenv
NODE_ENV=development
PORT=3340
TZ=UTC

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=elco_sage_nest

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=6

# Origines autorisées en production, séparées par des virgules (toutes en développement)
CORS_ORIGINS=http://localhost:5173
```

Le serveur tourne en UTC. Le fuseau métier, `Africa/Kinshasa`, est appliqué par le code pour les journées et les heures affichées.

Créer la base, puis jouer les migrations et les données de départ :

```bash
createdb elco_sage_nest
pnpm migration:run
pnpm seed            # tout : compte administrateur et catalogue de départ
pnpm seed admin      # ou seulement le compte administrateur
pnpm seed catalog    # ou seulement le catalogue
```

Le seeder crée le compte `admin@gmail.com` avec le mot de passe `12345678`. **Changez ce mot de passe hors du développement.**

### Application

```bash
cd web
pnpm install
```

L'URL de l'API est fixée au build par `VITE_API_URL` :

- `web/.env.development` : `http://localhost:3340/api/` ;
- `web/.env.production` : `/api/`, car le front et l'API sont servis sur la même origine.

## Développement

Lancer l'API et l'application dans deux terminaux :

```bash
pnpm --dir api dev   # http://localhost:3340/api
pnpm --dir web dev   # http://localhost:5173
```

### Commandes

| Commande | `api/` | `web/` |
| --- | --- | --- |
| `pnpm dev` | serveur avec rechargement | serveur Vite |
| `pnpm build` | compile dans `dist/` | typecheck, puis build dans `dist/` |
| `pnpm typecheck` | ✓ | ✓ |
| `pnpm lint` | oxlint | — |
| `pnpm format` | Prettier | Prettier |
| `pnpm migration:run` / `migration:revert` / `migration:show` | migrations TypeORM | — |
| `pnpm seed [admin\|catalog]` | données de départ | — |

## Fonctionnement

### Contrat de l'API

- **Réponse réussie :** `{ data: … }`, enveloppée par un intercepteur. « Pas de donnée » vaut `{ data: null }`.
- **Erreur métier :** `422 { message }`.
- **Validation :** `422 { message, errors: [{ field, message }] }`, avec des messages en français.
- **Identifiant mal formé ou inconnu :** `404` en JSON.
- **Authentification :** un token opaque `Authorization: Bearer elco_<id>.<secret>`, stocké dans Redis pour 10 jours et révocable immédiatement. Un compte est bloqué au 3e mot de passe erroné. Les routes de pilotage sont réservées à la direction (`ADMIN`, `DIRECTOR`).
- **Forme des réponses :** l'API renvoie ses entités. Les colonnes sensibles (`password`, `failedLoginAttempts`) ne sont jamais lues par défaut. Les relations sont réduites par la requête à ce qui s'affiche, par exemple `operator: { id, fullName, email }`.
- **Listes paginées :** elles passent par `paginateBatch()`, qui renvoie `{ items, pagination: { offset, limit, totalItems } }`. Le total est compté dans la même requête.

### Caisse et hors ligne

- **Une seule session de caisse** est ouverte à la fois, partagée par tous les postes. N'importe quel utilisateur peut la clôturer, en ligne seulement. Les montants attendus sont recalculés par le serveur au moment de la clôture.
- **Les plages de numéros d'addition** sont réservées par utilisateur, 100 à la fois. Un poste hors ligne numérote ses ventes dans sa plage, et le serveur vérifie qu'un numéro reçu appartient bien à une plage du vendeur.
- **Les créations sont rejouables.** Le client génère l'id d'une vente ou d'un paiement. Un renvoi après une coupure retourne l'enregistrement existant au lieu de créer un doublon.
- **Les opérations sensibles sont verrouillées en base :** numérotation, ouverture et clôture de caisse, paiements d'une même dette.
- **Le front est une PWA.** Le service worker précache l'application, et les ventes faites hors ligne attendent dans IndexedDB.

### Cache

Les lectures peu changeantes (catalogue, clients, taux, comptes) sont mises en cache dans Redis par `@Cacheable` sur les routes. Les écritures le vident par `@CacheInvalidate`. Les services n'y touchent jamais. Une panne de Redis est tolérée : la lecture se fait alors en base.

## Production

En production, Nginx :

- sert `web/dist`, en renvoyant les routes de l'application vers `index.html` ;
- relaie `/api` vers l'API Nest.

Pour que la PWA se mette à jour, les fichiers de `/assets` (nommés avec une empreinte) se mettent en cache pour un an. `index.html`, `sw.js` et le manifeste doivent, eux, être servis en `no-cache`. Le service worker exige le HTTPS. La configuration Nginx et la persistance Redis (AOF) restent à préparer avec le déploiement.

## Conventions

- Le code et les commentaires sont en français, avec les accents. Les commentaires `//` sont nombreux dans les fonctions, et absents des déclarations de types.
- Les messages de commit sont en anglais, un commit par sujet.
- L'API est en ESM : les imports se terminent par `.js`.
- Les migrations sont écrites à la main en SQL. Les index et contraintes sont déclarés aussi sur les entités, sous le même nom.
