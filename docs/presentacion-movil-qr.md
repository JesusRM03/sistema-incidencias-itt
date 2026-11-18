# Demostración del jueves 19 de noviembre

Esta guía arranca la aplicación y MySQL 8.4 en la PC de la exposición. Utiliza seis usuarios ficticios y doce ubicaciones de ejemplo. El catálogo oficial requiere validación del Instituto. Cada teléfono usa el navegador y se conecta al mismo servidor que la computadora.

## Entrar ahora desde el teléfono

Abre [la demostración HTTPS](https://incidencias-demostracion.up.railway.app) en Chrome o Safari. El certificado público lo administra Railway. Puedes abrir el mismo enlace desde otro equipo. En el panel privado de Railway, entra al servicio **incidencias → Variables** y revela solo la variable del rol que vas a usar. Los usuarios y nombres de las variables aparecen en la sección 3. La nube y la PC generan contraseñas e inventarios QR independientes.

Para el ensayo físico abre la demo con los datos móviles del teléfono, inicia sesión con `alumno@toluca.tecnm.mx`, escanea una etiqueta impresa desde ese mismo despliegue y registra una foto. Conserva el folio para consultarlo en la computadora. La URL depende del saldo y vigencia del Trial. La presentación en la red local usa la instalación siguiente.

## 1. Instalar en Windows

Instala Git, Node.js 24 y Docker Desktop con el motor de contenedores Linux (WSL 2). Abre Docker Desktop y espera a que indique que el motor está en ejecución. En PowerShell:

```powershell
git clone --branch revision-final-movil-qr https://github.com/JesusRM03/sistema-incidencias-itt.git
cd sistema-incidencias-itt
node --version
docker compose version
ipconfig
```

Usa la **Dirección IPv4** del adaptador Wi-Fi conectado al teléfono. El siguiente ejemplo usa `192.168.1.25`. Sustitúyela por la de tu equipo. Mantén la PC encendida durante la exposición.

```powershell
npm run demo:config -- https://192.168.1.25:8443
npm run demo:up
docker compose -p itt-demo --env-file .env.demo -f compose.demo.yaml ps -a
```

La primera ejecución descarga las imágenes, instala las dependencias y compila React. `db`, `app` y `https` deben estar en ejecución. `seed` termina con código 0. Para ver un fallo de arranque:

```powershell
docker compose -p itt-demo --env-file .env.demo -f compose.demo.yaml logs --tail 50 seed app https
```

La configuración privada se crea una vez. Si cambia la IP, edita `APP_ORIGIN` y `DEMO_HOST` en `.env.demo`, conserva las claves y ejecuta `npm run demo:up`. Las imágenes de las etiquetas se deben volver a imprimir con el nuevo origen. El token y la versión se conservan.

## 2. Confiar en el certificado y abrir desde el teléfono

Caddy emite el certificado HTTPS local para esa IP. MySQL y Express se comunican por la red privada de Docker. El único puerto publicado es el de HTTPS. La exposición por Wi-Fi requiere que el teléfono y la PC puedan comunicarse entre sí. Las redes de invitados o del campus pueden aislar los dispositivos.

1. Copia el **certificado público** de la autoridad local a una carpeta. Se conserva al detener o reiniciar la demo.
2. Instálalo solo en los equipos de demostración. En Windows, PowerShell permite instalarlo para el usuario actual. Para un Android o iPhone, transfiere únicamente `ITT-demo.crt` por USB u otro medio bajo tu control.

```powershell
New-Item -ItemType Directory -Force certificados-demo | Out-Null
docker compose -p itt-demo --env-file .env.demo -f compose.demo.yaml cp https:/data/caddy/pki/authorities/local/root.crt ./certificados-demo/ITT-demo.crt
certutil -user -addstore Root .\certificados-demo\ITT-demo.crt
```

- **Android/Samsung.** En Ajustes busca **Instalar certificados**. Entra en **Certificado de CA** y selecciona `ITT-demo.crt`. Algunos equipos administrados restringen esta opción.
- **iPhone.** Abre el archivo, instala el perfil desde Ajustes y activa la confianza para esa raíz en **General → Información → Ajustes de confianza de certificados**.
- **Windows.** Si el firewall bloquea el acceso y la red es privada, ejecuta lo siguiente en PowerShell **como administrador**, cambiando el puerto si lo configuraste distinto.

```powershell
New-NetFirewallRule -DisplayName "ITT demo HTTPS" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8443 -Profile Private -RemoteAddress LocalSubnet
```

Abre en **ambos** dispositivos la URL exacta de `APP_ORIGIN`. Primero prueba `https://192.168.1.25:8443/api/salud`: debe aparecer `{"ok":true}` sin advertencia de certificado. Después abre la raíz y autoriza la cámara al escanear. En el teléfono, `localhost` apunta al teléfono. Si la escuela aísla clientes, una red privada compartida entre la PC y el teléfono permite ensayar el mismo procedimiento, actualizando la IP.

Tras la presentación puedes quitar el certificado de los equipos y retirar la regla con `Remove-NetFirewallRule -DisplayName "ITT demo HTTPS"`. Guarda la clave privada de Caddy dentro de su volumen.

## 3. Cuentas y datos ficticios

En tu PC, `notepad .env.demo` muestra una contraseña aleatoria diferente por cuenta. Los correos son identificadores de la demo, sin envío de mensajes. Para la presentación bastan las tres primeras cuentas.

| Perfil | Usuario de demostración | Clave local |
| --- | --- | --- |
| Reportante | alumno@toluca.tecnm.mx | DEMO_PASSWORD_ALUMNO |
| Técnico | tecnico@toluca.tecnm.mx | DEMO_PASSWORD_TECNICO |
| Administración | admin@toluca.tecnm.mx | DEMO_PASSWORD_ADMIN |
| Segunda administración | supervisor@toluca.tecnm.mx | DEMO_PASSWORD_SUPERVISOR |
| Docente reportante | docente@toluca.tecnm.mx | DEMO_PASSWORD_DOCENTE |
| Otro reportante | otro@toluca.tecnm.mx | DEMO_PASSWORD_OTRO |

La siembra crea cuatro edificios, tres espacios por edificio, doce QR y doce incidencias repartidas entre seis estados. Cada folio de muestra incluye los eventos que le corresponden. Un folio creado durante la exposición recibe su propio identificador. La cuenta de la API tiene permisos por tabla y solo puede consultar y agregar eventos y auditorías.

## 4. Etiquetas QR

1. Como administrador, abre **Catálogos y QR → Espacios**. **Etiqueta QR** abre una etiqueta individual. **Descargar PNG** e **Imprimir etiqueta** incluyen edificio, clave, nombre del espacio, versión y código.
2. **Preparar todas las etiquetas** reúne los espacios activos. **Descargar lote ZIP** incluye un PNG por espacio; **Imprimir etiquetas** abre la hoja de impresión. Puedes guardar esa hoja como PDF desde el navegador.
3. **Renovar** pide un motivo e invalida la versión anterior. La redescarga conserva el QR vigente. El modelo del PDF define vigencia por revocación y disponibilidad del espacio. Las etiquetas vigentes no tienen una fecha de caducidad programada.
4. Para un salón real, registra primero el edificio validado, después el espacio con su clave y nombre. Las coordenadas son opcionales. Para reportar en el edificio completo, usa **Edificios → Etiqueta del edificio**. Al confirmar se crea, si falta, un espacio de área general dentro del edificio. Así se mantiene la relación con `espacio` del modelo relacional.
5. En el teléfono usa su cámara normal o **Reportar una incidencia → Identificar espacio por QR**. Puedes leer una foto de la etiqueta o pegar el enlace. El acceso pide sesión, muestra la ubicación y espera **Usar este espacio**. Una etiqueta revocada permite elegir otra ubicación.

## 5. Detener o repetir las pruebas

`npm run demo:stop` detiene los servicios y conserva datos. `npm run demo:up` los recupera. Para empezar la presentación otra vez desde los datos iniciales:

```powershell
npm run demo:reset
```

Lee el aviso y escribe literalmente `REINICIAR itt-demo`. El script comprueba el proyecto Compose, los nombres, el controlador local y las etiquetas de los dos volúmenes desechables. Al confirmar reemplaza únicamente `itt-demo_database` y `itt-demo_evidence`. La autoridad HTTPS y las contraseñas locales se conservan. **Los QR anteriores al reinicio completo dejan de pertenecer a la nueva demo**: prepara e imprime las etiquetas después de reiniciar. Para conservar etiquetas e historial utiliza detener/iniciar.

## 6. Guion para la maestra

| Momento | Acción | Qué mostrar |
| --- | --- | --- |
| Inicio | Administración prepara una etiqueta. El alumno la escanea en el teléfono e inicia sesión. | La pantalla identifica el salón. El alumno confirma la ubicación. |
| Registro | El alumno describe la falla, toma o selecciona una foto y la previsualiza. Envía el reporte. | Anota el folio y abre la foto desde el detalle. Si aparece una coincidencia, explica qué equipo es diferente. |
| Atención | Administración clasifica y asigna. El técnico abre su bandeja, guarda diagnóstico y avance, añade evidencia y envía la solución. | El historial registra responsables y el estado pasa a **En revisión**. |
| Cierre | Un administrador independiente aprueba. El alumno comprueba el resultado y confirma el cierre. | Muestra **Cerrado**, el historial y el aviso individual. La opción de inconformidad permite reabrir una solución. |
| Reporte | Administración busca el folio en **Reportes** y exporta el CSV. | Contrasta el folio, estado y ubicación con el registro original. |

## 7. Repetir las pruebas automatizadas en la demo local

En la PC de pruebas, la demo debe estar iniciada y el certificado instalado. Estos comandos escriben incidencias de prueba en `itt-demo`. Para volver a los doce folios originales utiliza la sección 5. Abre PowerShell dentro de la carpeta del proyecto.

```powershell
npm ci
npm run lint
npm test
npm run build
docker run --rm --network itt-demo_default --env-file .env.demo --env DB_HOST=db --env PRIVATE_FILES=/app/var/evidencias --mount "type=bind,source=$((Resolve-Path .\tests).Path),target=/app/tests,readonly" --volume itt-demo_evidence:/app/var/evidencias itt-incidencias-demo:local node --test tests/integration/api.test.js tests/integration/persistencia.test.js
npx playwright install chromium
$env:ITT_ENV_FILE = ".env.demo"
$env:NODE_EXTRA_CA_CERTS = (Resolve-Path .\certificados-demo\ITT-demo.crt).Path
npm run test:e2e
```

## 8. Publicación en Internet

La IP del Wi-Fi sirve dentro de esa red. Para datos móviles se requiere un origen público HTTPS estable. En Railway el despliegue usa un proyecto académico separado: un servicio web construido con `deploy/Dockerfile`, MySQL 8.4 en la red privada y volúmenes persistentes para la base y `/app/var/evidencias`. Solo el servicio web necesita dominio público. Configura `APP_ORIGIN` con ese dominio exacto, `NODE_ENV=production`, `BIND_HOST=0.0.0.0`, `COOKIE_SECURE=true` y el puerto de la plataforma. Activa `BEHIND_PROXY=true` cuando el único acceso provenga del proxy de confianza. Carga el esquema con la cuenta de migración y utiliza otra de permisos limitados para la API. Genera secretos privados para ese entorno y emite las etiquetas con ese origen.

El funcionamiento en datos móviles se cuenta como verificado tras abrir la URL, iniciar sesión, registrar una incidencia con evidencia y recuperar el mismo folio desde otro dispositivo. El inventario oficial, dominio institucional y continuidad en infraestructura del ITT tienen su propia validación.
