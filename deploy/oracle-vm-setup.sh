#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <GITHUB_REPO_URL> [APP_DIR]"
  echo "Example: $0 https://github.com/your-user/atm.git /opt/atm"
  exit 1
fi

GITHUB_REPO_URL="$1"
APP_DIR="${2:-/opt/atm}"
APP_USER="${SUDO_USER:-ubuntu}"

echo "[1/8] Updating apt packages..."
sudo apt update -y
sudo apt upgrade -y

echo "[2/8] Installing dependencies..."
sudo apt install -y curl git ufw

echo "[3/7] Installing Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

if [[ -d "$APP_DIR/.git" ]]; then
  echo "[4/7] Repo already exists at $APP_DIR, pulling latest..."
  cd "$APP_DIR"
  git pull
else
  echo "[4/7] Cloning repository to $APP_DIR..."
  sudo mkdir -p "$(dirname "$APP_DIR")"
  sudo git clone "$GITHUB_REPO_URL" "$APP_DIR"
  sudo chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "[5/7] Installing project dependencies..."
npm install

if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    echo "Created .env from .env.example. Edit it before starting the bot."
  else
    touch .env
    echo "Created empty .env. Add DISCORD_TOKEN before starting the bot."
  fi
fi

echo "[6/7] Setting up systemd service..."
sudo cp "$APP_DIR/deploy/atm.service" /etc/systemd/system/atm.service
sudo systemctl daemon-reload
sudo systemctl enable atm
sudo systemctl start atm

echo "[7/7] Enabling firewall (SSH stays open)..."
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "Setup complete. Next steps:"
echo "  cd $APP_DIR"
echo "  nano .env      # set DISCORD_TOKEN"
echo "  sudo systemctl restart atm"
echo "  sudo systemctl status atm"
echo "  sudo systemctl logs atm -f"
