#!/bin/bash

# Script para cambiar contraseña usando cURL
# 
# INSTRUCCIONES:
# 1. Reemplaza TU_PROYECTO con tu proyecto de Supabase
# 2. Reemplaza TU_SERVICE_ROLE_KEY con tu service role key
# 3. Reemplaza la contraseña deseada
# 4. Ejecuta: bash change_password_curl.sh

SUPABASE_URL="https://TU_PROYECTO.supabase.co"
SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
USER_ID="501bdfe7-5568-4411-a666-7b17d21face1"
NEW_PASSWORD="TuNuevaContraseña123!"

curl -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"password\": \"${NEW_PASSWORD}\"}"

