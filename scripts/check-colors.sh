#!/bin/bash

# Script per verificare che non ci siano colori hardcodati nei file del progetto
# I colori dovrebbero essere definiti solo in global.css tramite variabili CSS

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory del progetto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$PROJECT_DIR/src"

# File da escludere (global.css è l'unico file dove i colori sono permessi)
EXCLUDE_FILES="global.css"

# Pattern per trovare colori hardcodati
# - Hex colors: #RGB, #RRGGBB, #RRGGBBAA
# - RGB/RGBA: rgb(...), rgba(...)
# - HSL/HSLA: hsl(...), hsla(...)
HEX_PATTERN='#[0-9A-Fa-f]{3,8}\b'
RGB_PATTERN='rgba?\s*\([^)]+\)'
HSL_PATTERN='hsla?\s*\([^)]+\)'

# Colori permessi (colori Tailwind base che sono accettabili)
# Questi sono usati in classi Tailwind come bg-white, text-black, ecc.
ALLOWED_COLORS=(
    "transparent"
    "currentColor"
    "inherit"
)

echo "========================================"
echo "  Verifica Colori Hardcodati"
echo "========================================"
echo ""
echo "Directory: $SRC_DIR"
echo ""

FOUND_ISSUES=0

# Funzione per verificare un file
check_file() {
    local file="$1"
    local filename=$(basename "$file")

    # Salta global.css
    if [[ "$filename" == "global.css" ]]; then
        return 0
    fi

    local issues=""

    # Cerca colori hex (escludi variabili CSS come var(--color-...))
    # e escludi i riferimenti a immagini SVG inline
    local hex_matches=$(grep -nE "$HEX_PATTERN" "$file" 2>/dev/null | grep -v "var(--" | grep -v "svg" | grep -v "data:image" || true)

    # Cerca rgb/rgba (escludi variabili CSS)
    local rgb_matches=$(grep -nE "$RGB_PATTERN" "$file" 2>/dev/null | grep -v "var(--" || true)

    # Cerca hsl/hsla (escludi variabili CSS)
    local hsl_matches=$(grep -nE "$HSL_PATTERN" "$file" 2>/dev/null | grep -v "var(--" || true)

    if [[ -n "$hex_matches" || -n "$rgb_matches" || -n "$hsl_matches" ]]; then
        echo -e "${YELLOW}File: ${file#$PROJECT_DIR/}${NC}"

        if [[ -n "$hex_matches" ]]; then
            echo -e "${RED}  Colori HEX trovati:${NC}"
            echo "$hex_matches" | while read -r line; do
                echo "    $line"
            done
            FOUND_ISSUES=1
        fi

        if [[ -n "$rgb_matches" ]]; then
            echo -e "${RED}  Colori RGB/RGBA trovati:${NC}"
            echo "$rgb_matches" | while read -r line; do
                echo "    $line"
            done
            FOUND_ISSUES=1
        fi

        if [[ -n "$hsl_matches" ]]; then
            echo -e "${RED}  Colori HSL/HSLA trovati:${NC}"
            echo "$hsl_matches" | while read -r line; do
                echo "    $line"
            done
            FOUND_ISSUES=1
        fi

        echo ""
        return 1
    fi

    return 0
}

# Trova tutti i file rilevanti
FILES=$(find "$SRC_DIR" -type f \( -name "*.astro" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" -o -name "*.css" -o -name "*.scss" \) 2>/dev/null)

FILE_COUNT=0
PROBLEM_FILES=0

for file in $FILES; do
    FILE_COUNT=$((FILE_COUNT + 1))
    if ! check_file "$file"; then
        PROBLEM_FILES=$((PROBLEM_FILES + 1))
    fi
done

echo "========================================"
echo "  Riepilogo"
echo "========================================"
echo ""
echo "File analizzati: $FILE_COUNT"

if [[ $PROBLEM_FILES -gt 0 ]]; then
    echo -e "${RED}File con problemi: $PROBLEM_FILES${NC}"
    echo ""
    echo -e "${YELLOW}Suggerimento:${NC}"
    echo "  Sostituisci i colori hardcodati con variabili CSS definite in global.css"
    echo "  Esempio: invece di '#3B5998' usa 'var(--color-primary)'"
    echo ""
    exit 1
else
    echo -e "${GREEN}Nessun colore hardcodato trovato!${NC}"
    echo ""
    exit 0
fi
