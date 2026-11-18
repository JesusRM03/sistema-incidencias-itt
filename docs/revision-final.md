# Revisión de la entrega de noviembre de 2026

Se probó la rama de revisión con el esquema y los doce espacios ficticios del proyecto. Para ejecutar la demostración en Windows, entrar desde el celular, obtener las contraseñas locales e imprimir las etiquetas, sigue la [guía de presentación](presentacion-movil-qr.md).

## Resultados de ejecución

| Comprobación | Resultado observado |
| --- | --- |
| ESLint y compilación de Vite | Ambos terminaron con código 0. La compilación produjo la aplicación React en `dist/`. |
| Node Test Runner, dominio y utilidades | 71 aprobadas, 0 fallidas y 0 omitidas. |
| Node Test Runner, integración | 48 aprobadas, 0 fallidas y 0 omitidas con MySQL Community 8.4.11. |
| Playwright, aplicación compilada | 12 aprobadas con Chromium 156, Express y Caddy 2.11.2. El navegador confió en la raíz local para el origen HTTPS. |
| Accesibilidad y tamaños | Las comprobaciones automáticas de axe de la suite pasaron. Se recorrieron nueve pantallas administrativas a 360, 768 y 1366 px y se comprobó el foco del menú con teclado. |
| Reinicio de procesos | Tras detener y levantar Express y MySQL sobre los mismos datos, se recuperaron por HTTPS el folio cerrado, su historial y las fotos. Se compararon sus huellas SHA-256 antes y después. |
| Configuración del servidor | Pasaron las seis comprobaciones de `scripts/deployment-check.js` en el entorno probado, incluida la cuenta de ejecución de permisos limitados. |

Entorno de las pruebas: Linux, Node.js 24.22.1 y Chromium sin interfaz gráfica. Se utilizaron bases exclusivas de demostración y pruebas. El navegador móvil fue emulado. Las fotos y las etiquetas que leyó el navegador fueron archivos de prueba. Las cifras de esta revisión corresponden a las suites ejecutadas en esta rama. Los informes anteriores del repositorio conservan su fecha y alcance.

## Cobertura de los procesos solicitados

| Proceso | Qué se comprobó |
| --- | --- |
| 1. Acceso | Inicio, cierre, redirección al QR tras autenticarse, cookie segura, expiración por inactividad y rechazo de la sesión cerrada. |
| 2. Alta en móvil | Ubicación, validación, advertencia de coincidencia, folio, doble envío concurrente y recuperación cuando el servidor guardó el alta y se perdió la respuesta. Solo se conservó un folio. |
| 3. Identificación por QR | Se decodificaron un PNG de una etiqueta emitida y un fotograma de cámara virtual. Se confirmó el salón, se rechazó un QR inválido y la renovación revocó la etiqueta anterior. La redescarga conservó el token. |
| 4. Fotografías | Entrada de captura emulada y galería, previsualización, quitar antes de enviar, borrador al cambiar de pantalla, recuperación del archivo privado. Se probaron cinco fotos, el rechazo de una sexta, un archivo inválido y otro de más de 5 MB. |
| 5. Asignación | Administración clasificó y asignó el trabajo. El técnico asignado accedió desde su bandeja. Un técnico ajeno recibió una denegación. |
| 6. Intervención | Diagnóstico, nota interna, avance, evidencia y solución. El trabajo pasó a revisión. |
| 7. Aprobación | Se aprobó la intervención de otra persona y se rechazó la autoaprobación. Se comprobaron permisos de rol y conflictos de versión. |
| 8. Cierre | El reportante confirmó el cierre. En otro caso, la inconformidad reabrió la incidencia. Se rechazó cancelar una incidencia cerrada. |
| 9. Historial y avisos | Se recuperó la secuencia de eventos y se marcó un aviso como leído sin modificar avisos ajenos. Las notas internas y evidencias privadas se comprobaron con usuarios distintos. |
| 10. Reportes | Filtros combinados, orden de fechas, descarga CSV, caracteres especiales y protección de celdas frente a fórmulas. Se compararon los resultados del panel y los registros filtrados. El total por estado superó las veinte filas de la página. |
| 11. Permisos | Pruebas de API con sesiones ficticias por rol, origen y token CSRF, activación con CAPTCHA y autorización del detalle y la imagen. Se comprobaron también los menús por rol. |
| 12. Persistencia | La suite reinició el proceso de Express. Una segunda comprobación reinició también MySQL y abrió nuevamente el mismo reporte con la misma evidencia. |

La impresión se comprobó hasta la selección de las etiquetas que recibe el diálogo del navegador. Quedan para el ensayo en sitio la hoja impresa, el enfoque de la cámara física, los permisos del teléfono, la instalación de la raíz local, la comunicación por el Wi-Fi del salón y, cuando haya un dominio público, el acceso por datos móviles. La instalación en un equipo Windows físico también requiere ensayo. No se tomaron mediciones de rendimiento en esta revisión.

## Cotejo con el diccionario de datos

Se compararon las tablas y la secuencia de campos del diccionario del PDF con `server/schema.sql` y la base inicializada. Coincidieron los nombres y el orden de **142 campos en 19 tablas**. MySQL informó 19 tablas InnoDB, 19 claves primarias, 29 restricciones de clave foránea, 20 restricciones únicas, 3 comprobaciones CHECK y 65 índices distintos contando primarios y únicos. La intervención, el evento de incidencia, la solicitud idempotente y la auditoría siguen siendo tablas separadas. La cuenta de la API puede agregar historial y auditorías, sin privilegios de eliminación. Para validar un inventario oficial se necesitan los datos autorizados del Instituto.

## Cambios por archivo o grupo

| Archivos | Cambio |
| --- | --- |
| `server/app.js`, `server/index.js` | Resolución autorizada de QR, etiqueta persistente por espacio, área general opcional de edificio, reintentos de alta, agregados por rol, avisos, aprobación independiente y arranque comprobable. |
| `src/App.jsx`, `src/api.js`, `src/hooks/useLoad.js`, `src/components/Shell.jsx`, `src/modern.css` | Continuidad después del acceso, errores de red, menú táctil y por teclado, estados, contraste y presentación adaptable. |
| `src/pages/NewIncident.jsx`, `src/drafts.js`, `src/components/Location.jsx`, `src/pages/CampusMap.jsx` | Borrador con fotos separado por usuario, reintentos del mismo envío, cámara y galería, mapa con ubicaciones compartidas y confirmación del QR. |
| `src/labels.js`, `src/components/QrBatch.jsx`, `src/pages/Catalogs.jsx` | Etiquetas PNG, descarga por lote en ZIP, hoja de impresión y emisión desde el catálogo. |
| `src/pages/Dashboard.jsx`, `src/pages/Detail.jsx`, `src/pages/Reports.jsx` | Totales autorizados, evidencia, acciones del flujo en móvil y estadísticas por edificio y periodo. |
| `compose.demo.yaml`, `deploy/`, `scripts/demo*.js`, `.dockerignore`, `.gitattributes`, `.gitignore` | MySQL, API y HTTPS aislados, permisos por tabla, cuentas ficticias con claves privadas y reinicio con comprobación de los volúmenes de la demo. |
| `scripts/restore.sh`, `scripts/load-test.js` | Restauración en destinos vacíos y uso de la clave de prueba entregada por el entorno. |
| `tests/domain.test.js`, `tests/integration/`, `tests/browser/`, `playwright.config.js` | Pruebas de dominio, de API y persistencia y de navegador móvil con imágenes reales de prueba. |
| `package*.json`, `README.md`, `docs/despliegue.md`, `docs/presentacion-movil-qr.md` | Biblioteca ZIP, comandos de demo, instalación y guion para la exposición. |

Los comandos de desarrollo son `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run test:integration` y `npm run test:e2e`. La integración necesita una cuenta con permisos **solo para las bases de pruebas** y la suite de navegador necesita la demo sembrada y la URL de origen confiable. Consulta la configuración de [despliegue y pruebas](despliegue.md) y la [guía de la demo](presentacion-movil-qr.md).
