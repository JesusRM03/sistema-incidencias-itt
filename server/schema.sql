CREATE TABLE IF NOT EXISTS rol (id TINYINT UNSIGNED PRIMARY KEY, nombre VARCHAR(20) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS usuario (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, rol_id TINYINT UNSIGNED NOT NULL, nombre VARCHAR(100) NOT NULL,
 correo VARCHAR(254) NOT NULL UNIQUE, tipo_persona ENUM('Alumno','Docente','Personal') NOT NULL,
 identificador VARCHAR(20) NOT NULL UNIQUE, password_hash VARCHAR(255), estado_cuenta ENUM('Pendiente','Activa','Inactiva') NOT NULL DEFAULT 'Pendiente',
 cambio_obligatorio BOOLEAN NOT NULL DEFAULT TRUE, creada_en DATETIME(6) NOT NULL, actualizada_en DATETIME(6) NOT NULL,
 version INT UNSIGNED NOT NULL DEFAULT 1, FOREIGN KEY(rol_id) REFERENCES rol(id)
);
CREATE TABLE IF NOT EXISTS sesion (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED NOT NULL, token_hash BINARY(32) NOT NULL UNIQUE,
 creada_en DATETIME(6) NOT NULL, ultima_actividad_en DATETIME(6) NOT NULL, revocada_en DATETIME(6),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id), INDEX(usuario_id,revocada_en)
);
CREATE TABLE IF NOT EXISTS credencial_temporal (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED NOT NULL, emitida_por BIGINT UNSIGNED NOT NULL,
 token_hash BINARY(32) NOT NULL UNIQUE, proposito ENUM('Alta','Recuperación') NOT NULL,
 emitida_en DATETIME(6) NOT NULL, vence_en DATETIME(6) NOT NULL, usada_en DATETIME(6), revocada_en DATETIME(6),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id), FOREIGN KEY(emitida_por) REFERENCES usuario(id)
);
CREATE TABLE IF NOT EXISTS reto_captcha (
 id CHAR(36) PRIMARY KEY, contexto_hmac BINARY(32) NOT NULL, proposito ENUM('Acceso','Cambio inicial') NOT NULL,
 respuesta_hmac BINARY(32) NOT NULL, creado_en DATETIME(6) NOT NULL, vence_en DATETIME(6) NOT NULL, consumido_en DATETIME(6)
);
CREATE TABLE IF NOT EXISTS intento_acceso (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED, reto_captcha_id CHAR(36) UNIQUE,
 cuenta_hmac BINARY(32) NOT NULL, origen_hmac BINARY(32) NOT NULL, resultado ENUM('Correcto','Fallido','Limitado','CAPTCHA inválido') NOT NULL,
 ocurrido_en DATETIME(6) NOT NULL, FOREIGN KEY(usuario_id) REFERENCES usuario(id), FOREIGN KEY(reto_captcha_id) REFERENCES reto_captcha(id),
 INDEX(cuenta_hmac,ocurrido_en), INDEX(origen_hmac,ocurrido_en)
);
CREATE TABLE IF NOT EXISTS edificio (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, clave VARCHAR(20) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS espacio (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, edificio_id BIGINT UNSIGNED NOT NULL, clave VARCHAR(20) NOT NULL, nombre VARCHAR(100) NOT NULL,
 mapa_x DECIMAL(7,6), mapa_y DECIMAL(7,6), activo BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY(edificio_id) REFERENCES edificio(id), UNIQUE(edificio_id,clave),
 CHECK ((mapa_x IS NULL AND mapa_y IS NULL) OR (mapa_x IS NOT NULL AND mapa_y IS NOT NULL AND mapa_x BETWEEN 0 AND 1 AND mapa_y BETWEEN 0 AND 1))
);
CREATE TABLE IF NOT EXISTS tipo_falla (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, clave VARCHAR(20) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS periodo_escolar (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, clave VARCHAR(20) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL,
 fecha_inicio DATE NOT NULL, fecha_fin DATE NOT NULL, activo BOOLEAN NOT NULL DEFAULT TRUE, CHECK(fecha_inicio<=fecha_fin)
);
CREATE TABLE IF NOT EXISTS codigo_qr (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, espacio_id BIGINT UNSIGNED NOT NULL, version INT UNSIGNED NOT NULL,
 token CHAR(64) NOT NULL UNIQUE, emitido_por BIGINT UNSIGNED NOT NULL, emitido_en DATETIME(6) NOT NULL, revocado_en DATETIME(6),
 espacio_vigente BIGINT UNSIGNED GENERATED ALWAYS AS (IF(revocado_en IS NULL,espacio_id,NULL)) STORED UNIQUE,
 FOREIGN KEY(espacio_id) REFERENCES espacio(id), FOREIGN KEY(emitido_por) REFERENCES usuario(id), UNIQUE(espacio_id,version)
);
CREATE TABLE IF NOT EXISTS incidencia (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, folio VARCHAR(30) NOT NULL UNIQUE, reportante_id BIGINT UNSIGNED NOT NULL,
 espacio_id BIGINT UNSIGNED NOT NULL, tipo_falla_id BIGINT UNSIGNED NOT NULL, periodo_id BIGINT UNSIGNED NOT NULL,
 descripcion VARCHAR(2000) NOT NULL, estado ENUM('Pendiente','En proceso','En revisión','Resuelto','Cerrado','Cancelado') NOT NULL DEFAULT 'Pendiente',
 prioridad ENUM('Alta','Media','Baja'), principal_id BIGINT UNSIGNED, diferencia_duplicado VARCHAR(1000), revision_duplicados_pendiente BOOLEAN NOT NULL DEFAULT FALSE,
 creada_en DATETIME(6) NOT NULL, resuelta_en DATETIME(6), cerrada_en DATETIME(6), version INT UNSIGNED NOT NULL DEFAULT 1,
 FOREIGN KEY(reportante_id) REFERENCES usuario(id), FOREIGN KEY(espacio_id) REFERENCES espacio(id), FOREIGN KEY(tipo_falla_id) REFERENCES tipo_falla(id),
 FOREIGN KEY(periodo_id) REFERENCES periodo_escolar(id), FOREIGN KEY(principal_id) REFERENCES incidencia(id),
 INDEX(reportante_id,creada_en,id), INDEX(espacio_id,tipo_falla_id,estado), INDEX(periodo_id,estado,creada_en), INDEX consulta_estado_tipo_fecha(estado,tipo_falla_id,creada_en,id)
);
CREATE TABLE IF NOT EXISTS solicitud_idempotente (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, usuario_id BIGINT UNSIGNED NOT NULL, operacion VARCHAR(40) NOT NULL, clave CHAR(36) NOT NULL,
 payload_hash BINARY(32) NOT NULL, incidencia_id BIGINT UNSIGNED NOT NULL UNIQUE, creada_en DATETIME(6) NOT NULL,
 FOREIGN KEY(usuario_id) REFERENCES usuario(id), FOREIGN KEY(incidencia_id) REFERENCES incidencia(id), UNIQUE(usuario_id,operacion,clave)
);
CREATE TABLE IF NOT EXISTS asignacion (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, incidencia_id BIGINT UNSIGNED NOT NULL, tecnico_id BIGINT UNSIGNED NOT NULL,
 asignada_por BIGINT UNSIGNED NOT NULL, inicio_en DATETIME(6) NOT NULL, fin_en DATETIME(6), motivo VARCHAR(1000) NOT NULL,
 incidencia_vigente BIGINT UNSIGNED GENERATED ALWAYS AS (IF(fin_en IS NULL,incidencia_id,NULL)) STORED UNIQUE,
 FOREIGN KEY(incidencia_id) REFERENCES incidencia(id), FOREIGN KEY(tecnico_id) REFERENCES usuario(id), FOREIGN KEY(asignada_por) REFERENCES usuario(id), INDEX(tecnico_id,fin_en,incidencia_id)
);
CREATE TABLE IF NOT EXISTS intervencion (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, incidencia_id BIGINT UNSIGNED NOT NULL, autor_id BIGINT UNSIGNED NOT NULL,
 tipo ENUM('Diagnóstico','Avance','Solución','Comentario') NOT NULL, texto VARCHAR(2000) NOT NULL,
 visibilidad ENUM('Pública','Interna') NOT NULL, creada_en DATETIME(6) NOT NULL,
 FOREIGN KEY(incidencia_id) REFERENCES incidencia(id), FOREIGN KEY(autor_id) REFERENCES usuario(id), UNIQUE(id,incidencia_id)
);
CREATE TABLE IF NOT EXISTS evidencia (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, incidencia_id BIGINT UNSIGNED NOT NULL, intervencion_id BIGINT UNSIGNED,
 autor_id BIGINT UNSIGNED NOT NULL, clave_archivo VARCHAR(255) NOT NULL UNIQUE, mime ENUM('image/jpeg','image/png') NOT NULL,
 tamano_bytes INT UNSIGNED NOT NULL, sha256 BINARY(32) NOT NULL, creada_en DATETIME(6) NOT NULL,
 FOREIGN KEY(incidencia_id) REFERENCES incidencia(id), FOREIGN KEY(autor_id) REFERENCES usuario(id),
 FOREIGN KEY(intervencion_id,incidencia_id) REFERENCES intervencion(id,incidencia_id), CHECK(tamano_bytes BETWEEN 1 AND 5000000)
);
CREATE TABLE IF NOT EXISTS evento_incidencia (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, incidencia_id BIGINT UNSIGNED NOT NULL, autor_id BIGINT UNSIGNED NOT NULL,
 tipo VARCHAR(40) NOT NULL, estado_anterior ENUM('Pendiente','En proceso','En revisión','Resuelto','Cerrado','Cancelado'),
 estado_nuevo ENUM('Pendiente','En proceso','En revisión','Resuelto','Cerrado','Cancelado') NOT NULL,
 motivo VARCHAR(2000), visibilidad ENUM('Pública','Interna') NOT NULL, detalle JSON, creado_en DATETIME(6) NOT NULL,
 FOREIGN KEY(incidencia_id) REFERENCES incidencia(id), FOREIGN KEY(autor_id) REFERENCES usuario(id), INDEX(incidencia_id,creado_en,id)
);
CREATE TABLE IF NOT EXISTS notificacion (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, evento_id BIGINT UNSIGNED NOT NULL, destinatario_id BIGINT UNSIGNED NOT NULL,
 leida_en DATETIME(6), FOREIGN KEY(evento_id) REFERENCES evento_incidencia(id), FOREIGN KEY(destinatario_id) REFERENCES usuario(id),
 UNIQUE(evento_id,destinatario_id), INDEX(destinatario_id,leida_en,id)
);
CREATE TABLE IF NOT EXISTS auditoria_admin (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id BIGINT UNSIGNED NOT NULL, entidad VARCHAR(40) NOT NULL, recurso_id VARCHAR(64) NOT NULL,
 accion VARCHAR(40) NOT NULL, motivo VARCHAR(1000) NOT NULL, antes JSON, despues JSON, creada_en DATETIME(6) NOT NULL,
 FOREIGN KEY(actor_id) REFERENCES usuario(id)
);
INSERT IGNORE INTO rol VALUES (1,'Reportante'),(2,'Técnico'),(3,'Administrador');
