import { agregarHistoricoDemo } from "./demo-historico.js";
import { ampliarCatalogo } from "./ampliar-catalogo.js";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { pool, query as q, transaction as tx } from "../server/db.js";
import { password } from "../server/domain.js";

const accounts = [
  ["admin", 3, "Administración demo", "Personal", "DEMO-ADM1"],
  ["supervisor", 3, "Supervisión demo", "Personal", "DEMO-ADM2"],
  ["tecnico", 2, "Técnico demo", "Personal", "DEMO-TEC1"],
  ["alumno", 1, "Alumno demo", "Alumno", "00000001"],
  ["docente", 1, "Docente demo", "Docente", "DEMO-DOC1"],
  ["otro", 1, "Segundo alumno demo", "Alumno", "00000002"],
];
const buildings = [
  [
    "T",
    "Sistemas Computacionales y TICs",
    0.8,
    0.39,
    [
      "Laboratorio de cómputo 1",
      "Laboratorio de cómputo 2",
      "Laboratorio de redes",
    ],
  ],
  [
    "F",
    "Aulas de Sistemas",
    0.57,
    0.53,
    ["Aula F-01", "Aula F-02", "Aula F-03"],
  ],
  [
    "B",
    "Centro de información",
    0.76,
    0.525,
    ["Sala de lectura", "Área de consulta", "Sala de cómputo"],
  ],
  [
    "H",
    "Cafetería",
    0.445,
    0.525,
    ["Comedor", "Área de mesas", "Área de servicio"],
  ],
];
const types = [
  "Proyector",
  "Mobiliario",
  "Instalación eléctrica",
  "Sanitarios",
  "Red o conectividad",
  "Otro",
];
const descriptions = [
  "El proyector no enciende al iniciar la clase y requiere revisión.",
  "La silla del espacio tiene una pata rota y no se puede utilizar.",
  "El contacto eléctrico presenta una falla intermitente.",
  "Se presenta una fuga de agua que requiere atención.",
  "La conexión de red no permite acceder a los servicios.",
  "La puerta no cierra correctamente desde esta mañana.",
];
const states = [
  "Pendiente",
  "En proceso",
  "En revisión",
  "Resuelto",
  "Cerrado",
  "Cancelado",
];
const when = (hours) => new Date(Date.now() - hours * 3600000);

async function seed(c) {
  const [db] = await q(c, "SELECT DATABASE() nombre");
  if (process.env.ALLOW_DEMO !== "true" || db.nombre !== "incidencias_itt_demo")
    throw new Error(
      "La siembra exige ALLOW_DEMO=true y la base exclusiva incidencias_itt_demo.",
    );
  if (process.argv.includes("--historico"))
    return { nueva: false, historicas: await agregarHistoricoDemo(c) };
  if (
    process.argv.includes("--if-empty") &&
    (await q(c, "SELECT 1 FROM usuario LIMIT 1")).length
  ) {
    await ampliarCatalogo(c);
    console.log("La demo ya tiene cuentas. Se conserva el contenido.");
    return { nueva: false, historicas: await agregarHistoricoDemo(c) };
  }
  for (const table of [
    "usuario",
    "edificio",
    "tipo_falla",
    "periodo_escolar",
    "reto_captcha",
    "intento_acceso",
  ]) {
    if ((await q(c, "SELECT 1 FROM " + table + " LIMIT 1")).length)
      throw new Error(
        "La demo requiere una base migrada vacía. Se conservan los registros existentes.",
      );
  }
  const users = {};
  for (const [key, role, name, kind, identifier] of accounts) {
    const hash = await argon2.hash(
      password(process.env["DEMO_PASSWORD_" + key.toUpperCase()]),
      { type: argon2.argon2id },
    );
    const r = await q(
      c,
      "INSERT INTO usuario(rol_id,nombre,correo,tipo_persona,identificador,password_hash,estado_cuenta,cambio_obligatorio,creada_en,actualizada_en) VALUES(?,?,?,?,?,?,'Activa',0,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6))",
      [role, name, key + "@toluca.tecnm.mx", kind, identifier, hash],
    );
    users[key] = r.insertId;
  }
  const year = new Intl.DateTimeFormat("en", {
    timeZone: "America/Mexico_City",
    year: "numeric",
  }).format(new Date());
  const period = await q(
    c,
    "INSERT INTO periodo_escolar(clave,nombre,fecha_inicio,fecha_fin) VALUES(?,?,?,?)",
    [
      "DEMO-" + year,
      "Periodo de demostración " + year,
      year + "-01-01",
      year + "-12-31",
    ],
  );
  const typeIds = [],
    spaces = [];
  for (const [index, name] of types.entries()) {
    const t = await q(c, "INSERT INTO tipo_falla(clave,nombre) VALUES(?,?)", [
      "TF" + (index + 1),
      name,
    ]);
    typeIds.push(t.insertId);
  }
  for (const [key, name, x, y, rooms] of buildings) {
    const b = await q(c, "INSERT INTO edificio(clave,nombre) VALUES(?,?)", [
      key,
      name,
    ]);
    for (const [index, room] of rooms.entries()) {
      const s = await q(
        c,
        "INSERT INTO espacio(edificio_id,clave,nombre,mapa_x,mapa_y) VALUES(?,?,?,?,?)",
        [
          b.insertId,
          key + "-" + String(index + 1).padStart(2, "0"),
          room,
          x,
          y,
        ],
      );
      spaces.push(s.insertId);
      await q(
        c,
        "INSERT INTO codigo_qr(espacio_id,version,token,emitido_por,emitido_en) VALUES(?,1,?,?,UTC_TIMESTAMP(6))",
        [s.insertId, randomBytes(32).toString("hex"), users.admin],
      );
    }
  }
  for (const [index, space] of spaces.entries()) {
    const state = states[index % 6],
      age = 48 + index * 8;
    const resolved = ["Resuelto", "Cerrado"].includes(state);
    const item = await q(
      c,
      "INSERT INTO incidencia(folio,reportante_id,espacio_id,tipo_falla_id,periodo_id,descripcion,estado,prioridad,creada_en,resuelta_en,cerrada_en) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      [
        "ITT-DEMO-" + String(index + 1).padStart(4, "0"),
        users.alumno,
        space,
        typeIds[index % 6],
        period.insertId,
        descriptions[index % 6],
        state,
        ["Alta", "Media", "Baja"][index % 3],
        when(age),
        resolved ? when(2) : null,
        state === "Cerrado" ? when(1) : null,
      ],
    );
    let previous = null;
    async function record(actor, type, next, note, time, assigned = false) {
      const e = await q(
        c,
        "INSERT INTO evento_incidencia(incidencia_id,autor_id,tipo,estado_anterior,estado_nuevo,motivo,visibilidad,creado_en) VALUES(?,?,?,?,?,?,'Pública',?)",
        [item.insertId, actor, type, previous, next, note, time],
      );
      for (const recipient of [
        users.admin,
        users.supervisor,
        users.alumno,
        ...(assigned ? [users.tecnico] : []),
      ])
        await q(
          c,
          "INSERT INTO notificacion(evento_id,destinatario_id) VALUES(?,?)",
          [e.insertId, recipient],
        );
      previous = next;
    }
    await record(
      users.alumno,
      "Registro",
      "Pendiente",
      "Incidencia de demostración.",
      when(age),
    );
    if (state === "Pendiente") continue;
    if (state === "Cancelado") {
      await record(
        users.admin,
        "cancelar",
        state,
        "Cancelación motivada de ejemplo.",
        when(1),
      );
      continue;
    }
    await q(
      c,
      "INSERT INTO asignacion(incidencia_id,tecnico_id,asignada_por,inicio_en,fin_en,motivo) VALUES(?,?,?,?,?,?)",
      [
        item.insertId,
        users.tecnico,
        users.admin,
        when(age - 1),
        state === "Cerrado" ? when(1) : null,
        "Asignación de demostración",
      ],
    );
    await record(
      users.admin,
      "Asignación",
      "En proceso",
      "Atención asignada al técnico demo.",
      when(age - 1),
      true,
    );
    if (state === "En proceso") continue;
    for (const [kind, detail, hours, next] of [
      [
        "Diagnóstico",
        "Se identificó el componente que presentó la falla.",
        4,
        "En proceso",
      ],
      [
        "Solución",
        "Se reemplazó el componente y se verificó el funcionamiento.",
        3,
        "En revisión",
      ],
    ]) {
      await q(
        c,
        "INSERT INTO intervencion(incidencia_id,autor_id,tipo,texto,visibilidad,creada_en) VALUES(?,?,?,?,'Pública',?)",
        [item.insertId, users.tecnico, kind, detail, when(hours)],
      );
      await record(users.tecnico, kind, next, detail, when(hours), true);
    }
    if (resolved)
      await record(
        users.admin,
        "aprobar",
        "Resuelto",
        "Solución revisada por administración.",
        when(2),
        true,
      );
    if (state === "Cerrado")
      await record(
        users.alumno,
        "cerrar",
        state,
        "El reportante confirmó el funcionamiento.",
        when(1),
      );
  }
  await ampliarCatalogo(c);
  return { nueva: true, historicas: await agregarHistoricoDemo(c) };
}
try {
  const { nueva, historicas } = await tx(seed, "siembra:incidencias_itt_demo");
  if (nueva)
    console.log(
      "Demo preparada: seis cuentas ficticias, veinticuatro espacios con QR y doce folios en seis estados.",
    );
  console.log(
    `Histórico de demostración 2024–2025: ${historicas} folios agregados.`,
  );
} finally {
  await pool.end();
}
