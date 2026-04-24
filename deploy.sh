#!/usr/bin/env bash
# deploy.sh — Full VPS deployment script for quantumconnect.africa
# Usage: sudo bash deploy.sh
# Run this once on a fresh VPS. On subsequent deploys, use: docker compose pull && docker compose up -d

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
DOMAIN="quantumconnect.africa"
WWW_DOMAIN="www.quantumconnect.africa"
EMAIL=""           # <-- set your certbot/Let's Encrypt email here
COMPOSE_FILE="$(cd "$(dirname "$0")" && pwd)/docker-compose.yml"
NGINX_CONF_DIR="$(cd "$(dirname "$0")" && pwd)/nginx"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
preflight() {
    info "Running pre-flight checks..."

    [[ $EUID -eq 0 ]] || error "Please run as root: sudo bash deploy.sh"

    command -v docker   &>/dev/null || error "Docker is not installed. Install it first: https://docs.docker.com/engine/install/"
    command -v docker   &>/dev/null && docker compose version &>/dev/null || error "Docker Compose plugin not found."

    [[ -f "$(dirname "$0")/.env" ]] || error ".env file not found. Copy .env.example to .env and fill in the values."

    [[ -n "$EMAIL" ]] || error "Set the EMAIL variable at the top of this script before running."

    # Check DNS resolves to this machine
    VPS_IP=$(curl -s --max-time 5 https://api.ipify.org || curl -s --max-time 5 http://ifconfig.me)
    DNS_IP=$(dig +short "$DOMAIN" | tail -n1)
    if [[ "$DNS_IP" != "$VPS_IP" ]]; then
        warn "DNS check: $DOMAIN resolves to $DNS_IP but this server is $VPS_IP"
        warn "Certbot will fail if DNS is not pointed at this server. Continue anyway? [y/N]"
        read -r ans
        [[ "$ans" =~ ^[Yy]$ ]] || exit 1
    else
        info "DNS OK: $DOMAIN -> $VPS_IP"
    fi

    # Ensure ports 80 and 443 are open
    if command -v ufw &>/dev/null; then
        ufw allow 80/tcp  &>/dev/null || true
        ufw allow 443/tcp &>/dev/null || true
        info "UFW: ports 80 and 443 allowed."
    fi
}

# ── Phase 1: Bootstrap nginx (HTTP only) ─────────────────────────────────────
bootstrap_nginx() {
    info "Phase 1: Starting nginx with HTTP-only bootstrap config..."

    # Use the bootstrap conf as the active config
    cp "$NGINX_CONF_DIR/nginx-bootstrap.conf" "$NGINX_CONF_DIR/active.conf"

    # Temporarily mount active.conf instead of nginx.conf
    ACTIVE_COMPOSE=$(mktemp)
    sed 's|nginx/nginx.conf|nginx/active.conf|g' "$COMPOSE_FILE" > "$ACTIVE_COMPOSE"

    docker compose -f "$ACTIVE_COMPOSE" up -d nginx
    sleep 3

    # Verify nginx is up
    if ! docker compose -f "$ACTIVE_COMPOSE" ps nginx | grep -q "running\|Up"; then
        docker compose -f "$ACTIVE_COMPOSE" logs nginx
        error "Nginx failed to start in bootstrap mode."
    fi

    info "Bootstrap nginx running on port 80."
    echo "$ACTIVE_COMPOSE" > /tmp/deploy_active_compose
}

# ── Phase 2: Obtain SSL certificate ──────────────────────────────────────────
obtain_cert() {
    info "Phase 2: Requesting SSL certificate from Let's Encrypt..."

    ACTIVE_COMPOSE=$(cat /tmp/deploy_active_compose)

    docker compose -f "$ACTIVE_COMPOSE" run --rm certbot \
        certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --force-renewal

    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        error "Certificate was not created. Check certbot output above."
    fi

    info "Certificate obtained: /etc/letsencrypt/live/$DOMAIN/"
}

# ── Phase 3: Switch to full HTTPS config ─────────────────────────────────────
switch_to_https() {
    info "Phase 3: Switching nginx to full HTTPS config..."

    ACTIVE_COMPOSE=$(cat /tmp/deploy_active_compose)

    # Stop bootstrap nginx
    docker compose -f "$ACTIVE_COMPOSE" stop nginx

    # Bring up everything with the real docker-compose.yml (uses nginx.conf with SSL)
    docker compose -f "$COMPOSE_FILE" up -d

    sleep 5

    # Test nginx config
    NGINX_CONTAINER=$(docker compose -f "$COMPOSE_FILE" ps -q nginx)
    if docker exec "$NGINX_CONTAINER" nginx -t 2>&1 | grep -q "successful"; then
        info "Nginx config test passed."
    else
        docker exec "$NGINX_CONTAINER" nginx -t
        error "Nginx config test failed."
    fi

    # Cleanup temp files
    rm -f "$ACTIVE_COMPOSE" /tmp/deploy_active_compose "$NGINX_CONF_DIR/active.conf"

    info "All services are up with HTTPS."
}

# ── Phase 4: Smoke test ───────────────────────────────────────────────────────
smoke_test() {
    info "Phase 4: Running smoke tests..."

    sleep 3

    HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "https://$DOMAIN/" || true)
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "301" || "$HTTP_CODE" == "302" ]]; then
        info "HTTPS smoke test passed (HTTP $HTTP_CODE)."
    else
        warn "HTTPS smoke test returned HTTP $HTTP_CODE — check logs: docker compose logs nginx"
    fi

    HTTP_REDIRECT=$(curl -sk -o /dev/null -w "%{http_code}" "http://$DOMAIN/" || true)
    if [[ "$HTTP_REDIRECT" == "301" ]]; then
        info "HTTP -> HTTPS redirect working."
    else
        warn "HTTP redirect returned $HTTP_REDIRECT (expected 301)."
    fi

    BACKEND_HEALTH=$(curl -sk -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/actuator/health" || true)
    if [[ "$BACKEND_HEALTH" == "200" ]]; then
        info "Backend health check passed."
    else
        warn "Backend health check returned $BACKEND_HEALTH — backend may still be starting up."
    fi
}

# ── Summary ───────────────────────────────────────────────────────────────────
summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "  Site:    https://$DOMAIN"
    echo "  API:     https://$DOMAIN/api/"
    echo ""
    echo "  Useful commands:"
    echo "    docker compose ps                  # service status"
    echo "    docker compose logs -f backend     # backend logs"
    echo "    docker compose logs -f nginx       # nginx logs"
    echo "    docker compose logs -f certbot     # cert renewal logs"
    echo ""
    echo "  SSL renewal is automatic (certbot runs every 12h)."
    echo "  To force renew: docker compose run --rm certbot certbot renew"
    echo ""
}

# ── Subsequent deploy (skip cert if already exists) ───────────────────────────
is_cert_valid() {
    [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]] && \
    openssl x509 -checkend 86400 -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" &>/dev/null
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
    echo ""
    info "Starting deployment for $DOMAIN"
    echo ""

    preflight

    if is_cert_valid; then
        info "Valid SSL certificate already exists — skipping bootstrap & certbot."
        info "Starting all services with existing cert..."
        docker compose -f "$COMPOSE_FILE" pull
        docker compose -f "$COMPOSE_FILE" up -d
    else
        # Start all backend services first so they're ready when nginx boots
        info "Starting postgres and backend services..."
        docker compose -f "$COMPOSE_FILE" up -d postgres backend frontend
        info "Waiting for backend to become healthy..."
        for i in {1..12}; do
            HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/actuator/health || true)
            [[ "$HEALTH" == "200" ]] && break
            echo "  waiting... ($i/12)"
            sleep 10
        done

        bootstrap_nginx
        obtain_cert
        switch_to_https
    fi

    smoke_test
    summary
}

main "$@"
