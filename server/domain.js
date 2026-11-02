import crypto from "node:crypto";
export const STATES = [
  "Pendiente",
  "En proceso",
  "En revisión",
  "Resuelto",
  "Cerrado",
  "Cancelado",
];
export const TRANSITIONS = {
  Pendiente: ["En proceso", "Cancelado"],
  "En proceso": ["En revisión", "Cancelado"],
  "En revisión": ["Resuelto", "En proceso"],
  Resuelto: ["Cerrado", "En proceso"],
  Cerrado: [],
  Cancelado: [],
};
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
export function check(ok, message, status = 422, extra = {}) {
  if (!ok) throw new HttpError(status, message, extra);
}
export function text(v, min = 1, max = 2000, label = "Campo") {
  check(
    typeof v === "string" && v.trim().length >= min && v.trim().length <= max,
    `${label}: entre ${min} y ${max} caracteres.`,
  );
  return v.trim();
}
export function id(v) {
  check(
    /^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) > 0,
    "Identificador inválido.",
  );
  return Number(v);
}
export const sha = (v) => crypto.createHash("sha256").update(v).digest();
export const token = () => crypto.randomBytes(32).toString("hex");
export const hmac = (v) =>
  crypto
    .createHmac("sha256", process.env.APP_SECRET)
    .update(String(v))
    .digest();
export function transition(from, to) {
  check(TRANSITIONS[from]?.includes(to), "Transición no permitida.", 409);
}
export function validateUser(d) {
  const nombre = text(d.nombre, 2, 100, "Nombre"),
    correo = text(d.correo, 3, 254, "Correo").toLowerCase(),
    identificador = text(d.identificador, 1, 20, "Identificador");
  check(
    /^[^\s@]+@toluca\.tecnm\.mx$/.test(correo),
    "Utiliza un correo @toluca.tecnm.mx.",
  );
  check(
    ["Alumno", "Docente", "Personal"].includes(d.tipo_persona),
    "Tipo de persona inválido.",
  );
  check(
    d.tipo_persona === "Alumno"
      ? /^\d{8}$/.test(identificador)
      : new RegExp(process.env.PAYROLL_PATTERN || "^[A-Za-z0-9-]{3,20}$").test(
          identificador,
        ),
    "Número de control o nómina inválido.",
  );
  check([1, 2, 3].includes(Number(d.rol_id)), "Rol inválido.");
  return {
    nombre,
    correo,
    identificador,
    tipo_persona: d.tipo_persona,
    rol_id: Number(d.rol_id),
  };
}
export function password(v) {
  check(
    typeof v === "string" &&
      v.length >= 12 &&
      v.length <= 128 &&
      /[a-z]/.test(v) &&
      /[A-Z]/.test(v) &&
      /\d/.test(v),
    "La contraseña necesita 12–128 caracteres, mayúscula, minúscula y número.",
  );
  return v;
}
export function csvCell(v) {
  let s = String(v ?? "");
  const first = Array.from(s).find((c) => c.charCodeAt(0) > 32 && c.trim());
  if (first && "=+@-".includes(first)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function meanHours(rows) {
  const hours = rows
    .filter((r) => ["Resuelto", "Cerrado"].includes(r.estado) && r.resuelta_en)
    .map(
      (r) =>
        (new Date(r.resuelta_en + "Z") - new Date(r.creada_en + "Z")) / 3600000,
    );
  return hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
}
export const safeUser = (u) => ({
  id: u.id,
  nombre: u.nombre,
  correo: u.correo,
  rol_id: u.rol_id,
  rol: u.rol,
  tipo_persona: u.tipo_persona,
  identificador: u.identificador,
  estado_cuenta: u.estado_cuenta,
  version: u.version,
});

export function canonical(value) {
  return JSON.stringify(value, (key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((k) => [k, item[k]]),
        )
      : item,
  );
}
