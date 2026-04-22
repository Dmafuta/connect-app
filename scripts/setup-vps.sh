#!/usr/bin/env bash
# QuantumConnect VPS Bootstrap Script
# Tested on Ubuntu 22.04 LTS
# Run as root: bash setup-vps.sh
set -euo pipefail

APP_DIR="/opt/quantumconnect"
COMPOSE_VERSION="2.27.0"

echo "==> [1/7] System update"
apt-get update -q && apt-get upgrade -y -q

echo "==> [2/7] Install dependencies"
apt-get install -y -q \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban unattended-upgrades

echo "==> [3/7] Install Docker Engine"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -q
apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
docker --version
docker compose version

echo "==> [4/7] Create app directory"
mkdir -p "$APP_DIR/nginx"
chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR" 2>/dev/null || true

echo "==> [5/7] Configure firewall (ufw)"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

echo "==> [6/7] Harden SSH (disable password auth)"
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl reload sshd

echo "==> [7/7] Enable unattended security upgrades"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo ""
echo "======================================================"
echo " VPS bootstrap complete."
echo " Next steps:"
echo "  1. Copy your .env file to $APP_DIR/.env"
echo "  2. Run the certbot-init script to issue SSL certs"
echo "  3. Push code to GitHub to trigger the CI/CD pipeline"
echo "======================================================"
