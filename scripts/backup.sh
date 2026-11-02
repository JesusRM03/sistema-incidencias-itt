#!/usr/bin/env bash
# Cold application backup: the API must be stopped for the complete backup window.
set -euo pipefail
: "${BACKUP_DIR:?Define un directorio de respaldo externo al servidor}"
: "${DB_NAME:?Define DB_NAME}"
: "${MYSQL_DEFAULTS_FILE:?Archivo de opciones MySQL privado con usuario y contraseña}"
: "${API_STOPPED:?Confirma API_STOPPED=true después de detener la API}"
[[ "$API_STOPPED" == true ]] || exit 1
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/$stamp"
mkdir -p "$target/evidencias"
chmod 700 "$target"
mysqldump --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --single-transaction --routines --triggers --hex-blob --no-tablespaces "$DB_NAME" > "$target/database.sql"
cp -a "${PRIVATE_FILES:-./var/evidencias}/." "$target/evidencias/"
(cd "$target" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
printf '%s\n' "Copia generada en $target. Verifica y cifra antes de trasladar fuera del servidor."
