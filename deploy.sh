#!/bin/bash

# ============================================
# DEPLOY SCRIPT - Viral Digital Agency
# ============================================
# Uso: ./deploy.sh [opzione]
# Opzioni:
#   build     - Solo build del sito
#   deploy    - Build + deploy su server remoto
#   start     - Avvia server locale (per test)
#   dev       - Avvia dev server con TinaCMS
# ============================================

set -e

# ==========================================
# CONFIGURAZIONE - MODIFICA QUESTI VALORI
# ==========================================
REMOTE_USER="root"
REMOTE_HOST="tuo-server.com"
REMOTE_PATH="/var/www/viralagency"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verifica che npm sia installato
check_deps() {
    if ! command -v npm &> /dev/null; then
        log_error "npm non trovato. Installa Node.js prima di continuare."
        exit 1
    fi
}

# Installa dipendenze
install_deps() {
    log_step "Installazione dipendenze..."
    npm install
}

# Build del sito
build_site() {
    log_step "Building site..."
    npm run build
    log_info "Build completato! File in ./dist"
}

# Deploy su server remoto via rsync
deploy_remote() {
    log_step "Deploy su $REMOTE_HOST..."

    # Verifica che dist esista
    if [ ! -d "dist" ]; then
        log_error "Cartella dist non trovata. Esegui prima il build."
        exit 1
    fi

    # Rsync per sincronizzare i file
    rsync -avz --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        dist/ \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

    log_info "Deploy completato!"
    log_info "Sito disponibile su: https://${REMOTE_HOST}"
}

# Avvia server locale per test
start_local() {
    log_info "Avvio server locale..."
    npm run preview
}

# Dev mode con TinaCMS
start_dev() {
    log_info "Avvio ambiente di sviluppo con TinaCMS..."
    log_info "CMS disponibile su: http://localhost:4321/admin"
    npm run dev
}

# Mostra configurazione nginx suggerita
show_nginx_config() {
    echo ""
    log_info "Configurazione nginx consigliata per il tuo server:"
    echo ""
    cat << 'NGINX'
server {
    listen 80;
    server_name tuo-dominio.it www.tuo-dominio.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tuo-dominio.it www.tuo-dominio.it;

    # SSL (usa certbot per generare i certificati)
    ssl_certificate /etc/letsencrypt/live/tuo-dominio.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tuo-dominio.it/privkey.pem;

    root /var/www/viralagency;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
    echo ""
}

# Main
case "$1" in
    build)
        check_deps
        install_deps
        build_site
        ;;
    deploy)
        check_deps
        install_deps
        build_site
        deploy_remote
        ;;
    start)
        start_local
        ;;
    dev)
        check_deps
        install_deps
        start_dev
        ;;
    nginx)
        show_nginx_config
        ;;
    *)
        echo "============================================"
        echo "  DEPLOY SCRIPT - Viral Digital Agency"
        echo "============================================"
        echo ""
        echo "Uso: $0 {build|deploy|start|dev|nginx}"
        echo ""
        echo "Opzioni:"
        echo "  build   - Build del sito statico (output: ./dist)"
        echo "  deploy  - Build + deploy su server remoto via rsync"
        echo "  start   - Avvia server locale (preview del build)"
        echo "  dev     - Avvia dev server con TinaCMS editor"
        echo "  nginx   - Mostra configurazione nginx consigliata"
        echo ""
        echo "Prima del deploy, modifica le variabili nel file:"
        echo "  REMOTE_USER, REMOTE_HOST, REMOTE_PATH"
        echo ""
        exit 1
        ;;
esac
