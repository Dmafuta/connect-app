#!/usr/bin/env bash
# First-time SSL certificate issuance for QuantumConnect
# Run AFTER setup-vps.sh and AFTER the first docker compose up (HTTP-only)
# Usage: bash certbot-init.sh quantumconnect.africa your@email.com
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
APP_DIR="/opt/quantumconnect"
WEBROOT="/var/lib/docker/volumes/quantumconnect_certbot_webroot/_data"

echo "==> Issuing certificate for $DOMAIN (and www.$DOMAIN)"

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v "$WEBROOT":/var/www/certbot \
  certbot/certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

echo "==> Certificate issued. Reloading nginx..."
cd "$APP_DIR"
docker compose exec nginx nginx -s reload

echo ""
echo "SSL is now active for $DOMAIN"
echo "Certbot auto-renewal is handled by the certbot service in docker-compose.yml"
