#!/bin/bash

# Script de test pour l'API export/import

set -e

echo "ðŸ§ª Test de l'API Export/Import"
echo "=============================="

BASE_URL="http://localhost:3000"
TOKEN="" # Ã€ obtenir aprÃ¨s login admin

# Fonction pour faire login
login() {
  echo "ðŸ” Tentative de login admin..."
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@cyberquiz.fr",
      "password": "change-this-secure-password"
    }')
  
  TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo "âŒ Erreur lors du login"
    echo "RÃ©ponse: $RESPONSE"
    exit 1
  fi
  
  echo "âœ… Login rÃ©ussi"
}

# Test d'export
test_export() {
  local format=$1
  local status=${2:-"all"}
  
  echo ""
  echo "ðŸ“¤ Test export: format=$format, status=$status"
  
  RESPONSE=$(curl -s -b "auth-token=$TOKEN" \
    -o "export_test_${format}.${format}" \
    -w "%{http_code}" \
    "$BASE_URL/api/admin/questions/export?format=$format&status=$status")
  
  if [ "$RESPONSE" = "200" ]; then
    SIZE=$(ls -lh "export_test_${format}.${format}" | awk '{print $5}')
    echo "âœ… Export rÃ©ussi ($SIZE)"
  else
    echo "âŒ Export Ã©chouÃ© (HTTP $RESPONSE)"
  fi
}

# Test d'import
test_import() {
  echo ""
  echo "ðŸ“¥ Test import depuis sample-questions.csv"
  
  # VÃ©rifier que le fichier existe
  if [ ! -f "sample-questions.csv" ]; then
    echo "âŒ Fichier sample-questions.csv non trouvÃ©"
    return
  fi
  
  RESPONSE=$(curl -s -b "auth-token=$TOKEN" \
    -F "file=@sample-questions.csv" \
    "$BASE_URL/api/admin/questions/import")
  
  IMPORTED=$(echo $RESPONSE | grep -o '"imported":[0-9]*' | cut -d':' -f2)
  ERRORS=$(echo $RESPONSE | grep -o '"errors":\[' | wc -l)
  
  echo "ðŸ“Š RÃ©sultats:"
  echo "   Questions importÃ©es: $IMPORTED"
  echo "   Erreurs dÃ©tectÃ©es: $ERRORS"
  echo "   RÃ©ponse complÃ¨te: $RESPONSE"
}

# ExÃ©cution
echo ""
login

test_export "csv" "all"
test_export "xlsx" "accepted"

test_import

echo ""
echo "âœ… Tests terminÃ©s!"
echo ""
echo "ðŸ“ Fichiers gÃ©nÃ©rÃ©s:"
ls -lh export_test_* 2>/dev/null || echo "   (aucun fichier)"

