#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/opt/atm}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Not a git repo: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "Pulling latest code..."
git pull

echo "Installing dependencies..."
npm install

echo "Restarting bot with PM2..."
npx pm2 restart atm
npx pm2 save

echo "Done."
npx pm2 list
