# Presentación del 19 de noviembre de 2026: móvil y QR

Esta preparación NO integra la aplicación con SIIA, SAE ni el sistema real del ITT. Es un piloto académico con usuarios, espacios y datos ficticios.

## Qué incluye la rama
- El servidor puede escuchar en una red privada mediante `BIND_HOST`.
- QR únicos para los 12 espacios de demostración al cargar una base nueva.
- En **Catálogos y QR > Espacios**, el administrador puede emitir o recuperar TODAS las etiquetas de los espacios activos, imprimirlas y descargar PNG. El botón reutiliza los QR vigentes, NO los invalida.
- El visitante que abre una etiqueta QR desde la cámara del teléfono conserva el espacio y puede iniciar sesión antes de registrar la incidencia.
- El lector integrado acepta una foto que contenga el QR cuando la cámara en vivo del navegador está bloqueada.

## 1. Preparar el programa en una computadora
En Windows, instalar Node.js 24, MySQL 8.4 y espeak-ng siguiendo `docs/despliegue.md`. Crear una base de datos separada exclusivamente para la demo y ejecutar:

```powershell
npm ci
copy .env.example .env
npm run db:migrate
```

Configurar `.env` antes de ejecutar las migraciones. Generar un APP_SECRET aleatorio, elegir credenciales de la base de datos y asegurar que el archivo .env no se publique.

**IMPORTANTE:** `npm run db:demo` sólo funciona sobre una base vacía, migrada y desechable, usando `ALLOW_DEMO=true`. **No ejecutar la demo sobre una base con usuarios o incidencias reales**.

Después de cargar datos de prueba, ejecutar:
```powershell
npm run build
npm run server
```

## 2. Abrir desde el celular en la misma red Wi-Fi
1. Identificar la dirección IPv4 del equipo Windows con `ipconfig` (por ejemplo, `192.168.1.25`). El celular y la PC deben estar en la misma red privada y sin aislamiento entre clientes.
2. Modificar únicamente estos valores en `.env`:
```dotenv
BIND_HOST=0.0.0.0
PORT=3001
APP_ORIGIN=http://192.168.1.25:3001
COOKIE_SECURE=false
```
3. Sustituir `192.168.1.25` por la IPv4 real de la PC; reiniciar `npm run server`.
4. En Windows Defender Firewall, permitir el puerto TCP 3001 únicamente en el perfil de **red privada** y para la red necesaria; nunca abrirlo en la red pública ni redirigirlo desde el router.
5. Desde el celular abrir `http://192.168.1.25:3001`. El archivo `APP_ORIGIN` debe coincidir exactamente con la dirección utilizada para que la protección de origen permita guardar y modificar datos.
6. Desde administrador, abrir **Catálogos y QR > Espacios > Preparar todas las etiquetas**, después **Imprimir etiquetas**. Los QR incluirán el origen correcto del servidor.

El modo HTTP local sirve sólo para una demostración en red controlada, con cuentas ficticias. No es adecuado para cuentas reales ni para publicar la aplicación en Internet.

## 3. Cámara y HTTPS
Los navegadores modernos sólo permiten `getUserMedia` de forma normal desde HTTPS o `localhost`. En el celular, una IP LAN con HTTP permite usar el enlace QR desde la **cámara normal del teléfono** (que abre el navegador), o usar **Leer QR desde una fotografía** dentro del formulario, pero puede bloquear la cámara en vivo integrada.

Para usar **Escanear etiqueta QR** con cámara en vivo y para acceder desde datos móviles, desplegar el servidor detrás de un dominio HTTPS válido con un proxy inverso (por ejemplo, Caddy o Nginx), configurando `APP_ORIGIN=https://tu-dominio`, `NODE_ENV=production`, `COOKIE_SECURE=true` y una base y red protegidas. El servidor `BIND_HOST` debe volver a `127.0.0.1` detrás del proxy. No usar la contraseña de demostración en un despliegue público.

Si cambia `APP_ORIGIN`, volver a abrir la pantalla de etiquetas para generar los códigos con el enlace nuevo. No es necesario renovar o invalidar los tokens.

## 4. Prueba en vivo
1. Entrar como alumno ficticio desde el celular y registrar una incidencia con una imagen JPEG/PNG.
2. Entrar como administrador desde PC, filtrar el folio, priorizar y asignar al técnico.
3. Entrar como técnico, agregar diagnóstico, avance y enviar a revisión.
4. Entrar como administrador, aprobar la reparación.
5. Entrar como alumno, confirmar cierre y consultar historial y notificaciones.
6. Desde la cámara del celular, escanear un QR impreso: debe abrir el formulario con la ubicación correcta.
7. Desde administrador, consultar indicadores y exportar CSV.

## Alcance y verificación
Los 12 espacios de prueba **no son un inventario oficial de salones del ITT**. Agregar los edificios/salones reales validados a través de Catálogos antes de imprimir etiquetas institucionales. Los nombres, claves y puntos de mapa deben confirmarse con la escuela.

Ejecutar `npm run lint`, `npm test`, `npm run test:integration` y `npm run test:e2e` según sus requisitos. Este cambio todavía necesita verificarse físicamente en el equipo de presentación con MySQL, navegador móvil y el Wi-Fi previsto; no debe describirse como probado allí hasta hacerlo.
