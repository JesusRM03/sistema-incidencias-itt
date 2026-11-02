# Sistema de incidencias de infraestructura ITT

Aplicación web para registrar, asignar, atender, revisar y cerrar incidencias del Instituto Tecnológico de Toluca. Esta versión sustituye la simulación de `localStorage` por una API con permisos en el servidor y una base relacional MySQL de 19 tablas y 142 campos.

## Funciones

- Cuentas institucionales creadas por administración, primer acceso y recuperación con credencial temporal de un uso.
- Contraseñas Argon2id, sesiones revocables de 30 minutos, cookies protegidas, comprobación de origen y CSRF, limitación de intentos y CAPTCHA con imagen/audio.
- Catálogos de edificios, espacios, fallas y periodos; selección por catálogo, mapa o QR versionado.
- Incidencias con folio único, periodo vigente, evidencia JPEG/PNG privada y advertencias de posibles duplicados.
- Asignación/reasignación, diagnóstico, avances públicos/internos, revisión administrativa independiente y cierre confirmado por el reportante.
- Inconformidades, cancelación motivada, vinculación de duplicados e historial de responsables y eventos.
- Notificaciones individuales, reportes filtrados, tiempos medios y CSV protegido contra fórmulas.
- Interfaz institucional responsiva con navegación por rol, foco visible y contraste revisado.

## Inicio

Requisitos: Node 24, MySQL 8.4 y espeak-ng. Las instrucciones completas están en [docs/despliegue.md](docs/despliegue.md).

1. Ejecutar `npm ci` y copiar `.env.example` a `.env`.
2. Crear la base vacía y configurar sus credenciales, APP_SECRET y APP_ORIGIN.
3. Ejecutar `npm run db:migrate` con la cuenta de migraciones.
4. Crear al primer administrador mediante `npm run db:bootstrap`, definiendo ADMIN_EMAIL, ADMIN_IDENTIFIER y ADMIN_PASSWORD en el entorno.
5. Ejecutar `npm run build` y `npm run server`. La API sirve también la interfaz en el mismo origen.

Para desarrollo: API en el puerto 3001, `npm run dev` en 5173 y APP_ORIGIN=http://localhost:5173. En producción usar HTTPS, NODE_ENV=production y COOKIE_SECURE=true. No publicar MySQL ni el directorio de fotografías.

## Demostración

Solo sobre una base vacía y desechable, cargar `npm run db:demo` con ALLOW_DEMO=true. Incluye cuentas `admin`, `supervisor`, `tecnico`, `alumno`, `docente` y `otro` bajo `@toluca.tecnm.mx`, contraseña `PruebaITT2026!`.

Los usuarios y catálogos de la demostración son ficticios. El ITT debe validar ubicaciones, coordenadas y periodos antes de operar. El sistema no importa automáticamente los datos que estaban guardados en navegadores de la versión anterior.

## Verificación

- `npm run lint`
- `npm test`
- `npm run test:integration` sobre una base de prueba ya migrada y con la demo cargada.
- `npm run test:e2e` con el servidor de prueba iniciado. Instalar el motor de navegador con Playwright. CHROMIUM_EXECUTABLE permite señalar un ejecutable local de pruebas.
- `scripts/load-test.js`: ensayo configurable de 50 trabajadores con 10 000 y 20 000 registros. Requiere ALLOW_LOAD=true y una base desechable.

Las salidas y sus límites se describen en [docs/verificacion.md](docs/verificacion.md). Las pruebas de navegador no prueban automáticamente cámara física, disponibilidad de cuatro semanas, recuperación de desastres ni todos los navegadores de producción.

## Implantación pendiente de validación institucional

La infraestructura física, HTTPS del dominio definitivo, MySQL 8.4, réplica espejo, copias en caliente sin pausa, UPS, restauración medida y capacitación requieren configuración y evidencia en el destino. Se entregan scripts de respaldo/restauración con aplicación detenida y guía de operación; no se presentan esas tareas como certificadas.

El PDF menciona 224 casos de comprobación, pero no contiene sus fichas completas. El Word de pruebas conserva los 54 requisitos y distingue los ensayos realizados de los criterios todavía pendientes.
