#!/bin/bash

# ============================================
# DEPLOY SCRIPT - Viral Digital Agency
# ============================================
# Uso: ./deploy.sh [opzione]
# Opzioni:
#   build     - Solo build del sito
#   deploy    - Build + deploy su server remoto
#   setup     - Setup iniziale server (nginx + systemd)
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
DOMAIN="tuo-dominio.it"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

check_deps() {
    if ! command -v npm &> /dev/null; then
        log_error "npm non trovato. Installa Node.js prima di continuare."
        exit 1
    fi
}

install_deps() {
    log_step "Installazione dipendenze..."
    npm install
}

build_site() {
    log_step "Building site..."
    npm run build
    log_info "Build completato! File in ./dist"
}

# Deploy su server remoto via rsync
deploy_remote() {
    log_step "Deploy su $REMOTE_HOST..."

    if [ ! -d "dist" ]; then
        log_error "Cartella dist non trovata. Esegui prima il build."
        exit 1
    fi

    # Sync tutto il progetto (serve per TinaCMS)
    rsync -avz --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        ./ \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

    # Installa dipendenze e riavvia TinaCMS sul server
    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd /var/www/viralagency
npm install --production
sudo systemctl restart tina-cms
ENDSSH

    log_info "Deploy completato!"
    log_info "Sito: https://${DOMAIN}"
    log_info "Admin: https://${DOMAIN}/admin"
}

# Setup iniziale del server
setup_server() {
    log_step "Setup iniziale server..."

    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
# Crea directory
mkdir -p /var/www/viralagency
mkdir -p /var/www/certbot

# Installa Node.js se non presente
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Installa nginx se non presente
if ! command -v nginx &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
fi
ENDSSH

    # Copia configurazioni
    log_step "Copiando configurazioni nginx e systemd..."
    scp nginx/viralagency.conf ${REMOTE_USER}@${REMOTE_HOST}:/etc/nginx/sites-available/
    scp systemd/tina-cms.service ${REMOTE_USER}@${REMOTE_HOST}:/etc/systemd/system/

    # Sostituisci dominio placeholder con quello reale
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
sed -i "s/tuo-dominio.it/${DOMAIN}/g" /etc/nginx/sites-available/viralagency.conf

# Abilita sito nginx
ln -sf /etc/nginx/sites-available/viralagency.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Abilita servizio TinaCMS
systemctl daemon-reload
systemctl enable tina-cms

# Test nginx (senza SSL per ora)
nginx -t && systemctl reload nginx
ENDSSH

    log_info "Setup completato!"
    log_warn "Per abilitare HTTPS, esegui sul server:"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}

# Avvia server locale per test
start_local() {
    log_info "Avvio server locale..."
    npm run preview
}

# Dev mode con TinaCMS
start_dev() {
    log_info "Avvio ambiente di sviluppo con TinaCMS..."
    log_info "Sito: http://localhost:4321"
    log_info "Admin: http://localhost:4321/admin"
    npm run dev
}

# Restart TinaCMS sul server
restart_tina() {
    log_step "Riavvio TinaCMS sul server..."
    ssh ${REMOTE_USER}@${REMOTE_HOST} "sudo systemctl restart tina-cms"
    log_info "TinaCMS riavviato!"
}

# Mostra log TinaCMS
show_logs() {
    log_info "Log TinaCMS (Ctrl+C per uscire)..."
    ssh ${REMOTE_USER}@${REMOTE_HOST} "journalctl -u tina-cms -f"
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
    setup)
        setup_server
        ;;
    start)
        start_local
        ;;
    dev)
        check_deps
        install_deps
        start_dev
        ;;
    restart)
        restart_tina
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "============================================"
        echo "  DEPLOY SCRIPT - Viral Digital Agency"
        echo "============================================"
        echo ""
        echo "Uso: $0 {build|deploy|setup|start|dev|restart|logs}"
        echo ""
        echo "Opzioni:"
        echo "  build   - Build del sito statico"
        echo "  deploy  - Build + deploy su server"
        echo "  setup   - Setup iniziale server (nginx + systemd)"
        echo "  start   - Avvia server locale (preview)"
        echo "  dev     - Avvia dev server con TinaCMS"
        echo "  restart - Riavvia TinaCMS sul server"
        echo "  logs    - Mostra log TinaCMS"
        echo ""
        echo "Prima configura le variabili:"
        echo "  REMOTE_USER, REMOTE_HOST, REMOTE_PATH, DOMAIN"
        echo ""
        exit 1
        ;;
esac
