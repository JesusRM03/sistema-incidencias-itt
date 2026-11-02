# Implantación del sistema ITT

La API requiere Node 24, MySQL 8.4 y espeak-ng (CAPTCHA en audio). Windows y Linux pueden alojar Node y MySQL. En Windows el sintetizador se configura con ESPEAK_BINARY apuntando al ejecutable. Los scripts Bash de respaldo requieren WSL/Git Bash o una tarea equivalente de PowerShell validada por TI.

## Instalación

1. Instalar dependencias con `npm ci` y copiar `.env.example` a `.env`.
2. Crear una base vacía `CREATE DATABASE incidencias_itt CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`.
3. Configurar credenciales y generar APP_SECRET con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Mantener `.env` privado.
4. Ejecutar `npm run db:migrate` con una cuenta de migraciones. El script no elimina tablas ni datos.
5. En una base vacía ejecutar `npm run db:bootstrap` con ADMIN_EMAIL institucional, ADMIN_IDENTIFIER y ADMIN_PASSWORD configurados temporalmente en el entorno. No escribir contraseñas en el repositorio ni argumentos del proceso.
6. Verificar catálogos con el ITT. Los datos de `db:demo` son ficticios y solo deben usarse con ALLOW_DEMO=true sobre una base vacía de pruebas.
7. `npm run build` y `npm run server`. La API sirve también el cliente compilado en el mismo origen. En desarrollo se usa `npm run dev`, APP_ORIGIN=http://localhost:5173, API en 3001.
8. Publicar el origen mediante un proxy inverso HTTPS institucional. En producción fijar NODE_ENV=production, COOKIE_SECURE=true y APP_ORIGIN=https://dominio-autorizado. No abrir MySQL a Internet. La API escucha solo en loopback. Si MySQL está en otro nodo, configurar un túnel TLS o conector con CA verificada antes de usarlo fuera del host.
9. Ejecutar `node --env-file=.env scripts/deployment-check.js`; su resultado identifica verificaciones pendientes, no certifica un despliegue.

## Cuenta de ejecución y bitácoras

Utilizar una cuenta distinta para migraciones. Otorgar SELECT/INSERT/UPDATE sobre tablas operativas; solo SELECT e INSERT sobre evento_incidencia y auditoria_admin. Sin DELETE, ALTER, DROP ni privilegios globales para la API. No otorgar UPDATE a las bitácoras. Retirar la cuenta de bootstrap y comprobar SHOW GRANTS. Las correcciones históricas se registran con eventos posteriores.

El servidor registra errores estructurados sin cuerpos, cookies, contraseñas ni tokens. Configurar rotación y retención de logs. Los tokens temporales se entregan al destinatario por el procedimiento administrativo acordado, sin correo automático.

## Continuidad y respaldo

Los scripts `backup.sh` y `restore.sh` implementan una copia consistente con la aplicación detenida. El archivo MySQL de opciones debe tener permisos 600 y encontrarse fuera del repositorio. Programar la copia diaria en horario acordado, reiniciar la API al terminar y medir la ventana. Cifrar y copiar a un nodo separado; conservar cierres mensual, trimestral, semestral y anual según política. Verificar SHA256SUMS, restaurar a una base vacía y medir RPO/RTO. El respaldo en caliente sin pausa y la réplica espejo requieren configuración y ensayo institucional adicionales; no se declaran implantados por tener estos scripts.

## Responsabilidades físicas y operativas

TI debe validar UPS, contactos regulados, tierra física, protecciones eléctricas, firewall, servidor espejo y ubicación de copias. Son actividades de infraestructura, no funcionalidades que el programa pueda instalar o certificar. Medir disponibilidad durante cuatro semanas y realizar pruebas de restauración. El objetivo RPO <=24 h / RTO <=4 h requiere evidencia real de esas mediciones.

## Comprobaciones

- Unitarias: `npm test`.
- Integración: crear base de prueba vacía, migrar, cargar demo explícita y ejecutar `npm run test:integration` con APP_ORIGIN=http://localhost:3001. La suite modifica esa base; jamás usar datos institucionales.
- Interfaz: servidor de prueba iniciado y `npm run test:e2e`. Instalar motores con `npx playwright install chromium firefox`.
- Carga: `node --env-file=.env scripts/load-test.js` solo contra base de prueba con ALLOW_LOAD=true. Ejecutar después de las pruebas visuales.
- Seguridad e instalación: repetir las pruebas en el destino HTTPS, Windows y Linux. No sustituir esos resultados con una compilación local.
