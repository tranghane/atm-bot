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

echo "Restarting bot with systemctl..."
sudo systemctl restart atm
sudo systemctl status atm

echo "Done."
