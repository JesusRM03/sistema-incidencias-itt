# Sourced by the official MySQL entrypoint after 01-schema.sql creates the demo tables.
# demo-config.js creates this separate runtime credential as random hexadecimal.
[[ "$MYSQL_DATABASE" = incidencias_itt_demo && "$RUNTIME_PASSWORD" =~ ^[a-f0-9]{64}$ ]] || return 1
docker_process_sql <<SQL
CREATE USER 'itt_app'@'%' IDENTIFIED BY '${RUNTIME_PASSWORD}';
GRANT SELECT ON incidencias_itt_demo.* TO 'itt_app'@'%';
SQL
for table in usuario sesion credencial_temporal reto_captcha edificio espacio tipo_falla periodo_escolar codigo_qr incidencia asignacion notificacion; do
  docker_process_sql -e "GRANT INSERT, UPDATE ON incidencias_itt_demo.$table TO 'itt_app'@'%'"
done
for table in intento_acceso solicitud_idempotente intervencion evidencia evento_incidencia auditoria_admin; do
  docker_process_sql -e "GRANT INSERT ON incidencias_itt_demo.$table TO 'itt_app'@'%'"
done
