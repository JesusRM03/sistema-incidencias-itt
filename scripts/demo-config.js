import fs from "node:fs";
import { randomBytes } from "node:crypto";

const address = process.argv[2];
if (!address)
  throw new Error(
    "Indica la URL HTTPS del equipo, por ejemplo https://192.168.1.25:8443",
  );
const url = new URL(address);
if (
  url.protocol !== "https:" ||
  url.pathname !== "/" ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
)
  throw new Error(
    "Se requiere un origen HTTPS sin ruta, parámetros ni credenciales.",
  );
const secret = () => randomBytes(32).toString("hex");
const settings = [
  "# Archivo privado de esta instalación de demostración.",
  "APP_ORIGIN=" + url.origin,
  "DEMO_HOST=" + url.hostname,
  "HTTPS_PORT=" + (url.port || "443"),
  "APP_SECRET=" + secret(),
  "DB_NAME=incidencias_itt_demo",
  "DB_HOST=127.0.0.1",
  "DB_USER=itt_demo",
  "DB_PASSWORD=" + secret(),
  "MYSQL_ROOT_PASSWORD=" + secret(),
  "RUNTIME_PASSWORD=" + secret(),
  "ALLOW_DEMO=true",
  "COOKIE_SECURE=true",
  "PRIVATE_FILES=./var/demo/evidencias",
  ...["admin", "supervisor", "tecnico", "alumno", "docente", "otro"].map(
    (name) =>
      "DEMO_PASSWORD_" + name.toUpperCase() + "=Aa1" + secret().slice(0, 24),
  ),
];
fs.writeFileSync(".env.demo", settings.join("\n") + "\n", {
  flag: "wx",
  mode: 0o600,
});
console.log(
  "Configuración creada. Las claves individuales están en .env.demo. URL: " +
    url.origin,
);
