#!/bin/bash
# Déploiement d'Elco Sage, lancé sur le serveur par l'utilisateur deploy.
set -euo pipefail

echo "🚀 Déploiement Elco Sage..."

# Variables
APP_DIR="/var/www/elco_sage"
API_DIR="$APP_DIR/api"
WEB_DIR="$APP_DIR/web"
PM2_APP_NAME="elco-sage-api"

cd "$APP_DIR"

# 1. Pull des dernières modifications
echo "📥 Récupération des modifications..."
git pull --ff-only origin main

# 2. API : dépendances et build
echo "📦 Installation des dépendances de l'API..."
cd "$API_DIR"
pnpm install --frozen-lockfile

echo "🏗️ Build de l'API..."
rm -rf dist/
pnpm run build

# 3. Migrations, jouées avant le redémarrage pour que le nouveau code trouve son schéma
echo "🗄️ Migrations de la base..."
pnpm exec typeorm migration:run -d dist/database/data-source.js

# 3.1 Garder uniquement les dépendances nécessaires au runtime (typeorm et pg en font partie)
echo "🧹 Nettoyage des dépendances de développement de l'API..."
pnpm prune --prod

# 4. Web : dépendances et build (dist est recréé par Vite)
echo "📦 Installation des dépendances du web..."
cd "$WEB_DIR"
pnpm install --frozen-lockfile

echo "🏗️ Build du web..."
pnpm run build

# 4.1 Nginx ne sert que dist/ : node_modules ne sert plus après le build
echo "🧹 Suppression des dépendances du web..."
rm -rf node_modules

# 5. Gestion PM2 avec ecosystem.config.cjs
echo "🔄 Gestion du processus PM2..."
cd "$API_DIR"
mkdir -p logs
if pm2 describe "$PM2_APP_NAME" > /dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --only "$PM2_APP_NAME" --update-env
else
    pm2 start ecosystem.config.cjs --only "$PM2_APP_NAME"
fi

# 6. Sauvegarder la configuration PM2
echo "💾 Sauvegarde de la configuration PM2..."
pm2 save

# 7. Recharger Nginx (seule commande autorisée en sudo pour deploy)
echo "🔄 Rechargement de Nginx..."
sudo /usr/sbin/nginx -t && sudo /usr/bin/systemctl reload nginx

echo "✅ Déploiement terminé!"
echo "📱 API gérée par PM2: $PM2_APP_NAME"
