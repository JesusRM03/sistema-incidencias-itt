#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DIR:?Directorio de la copia}"
: "${RESTORE_CONFIRMED:?Confirma RESTORE_CONFIRMED=true sobre una base vacía de restauración}"
: "${MYSQL_DEFAULTS_FILE:?Archivo MySQL privado}"
: "${DB_NAME:?Base vacía de destino}"
[[ "$RESTORE_CONFIRMED" == true ]] || exit 1
[[ "$DB_NAME" =~ ^[a-zA-Z0-9_]+$ ]] || exit 1
table_count=$(mysql --defaults-extra-file="$MYSQL_DEFAULTS_FILE" --batch --skip-column-names "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()")
[[ "$table_count" = 0 ]] || { echo "La base de destino contiene tablas."; exit 1; }
target_files=${PRIVATE_FILES:-./var/evidencias}
[[ ! -e "$target_files" || -z "$(find "$target_files" -mindepth 1 -print -quit)" ]] || { echo "La carpeta de fotografías debe estar vacía."; exit 1; }
(cd "$RESTORE_DIR" && sha256sum -c SHA256SUMS)
mysql --defaults-extra-file="$MYSQL_DEFAULTS_FILE" "$DB_NAME" < "$RESTORE_DIR/database.sql"
mkdir -p "${PRIVATE_FILES:-./var/evidencias}"
cp -a "$RESTORE_DIR/evidencias/." "${PRIVATE_FILES:-./var/evidencias}/"
printf '%s\n' 'Restauración terminada. Verifica conteos y abre tres incidencias con fotografías antes de liberar el servicio.'
