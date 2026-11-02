// Explicit opt-in only. Run against a disposable database, never institutional data.
import argon2 from "argon2";
import { pool, query as q, transaction as tx } from "../server/db.js";
if (process.env.ALLOW_DEMO !== "true")
  throw new Error("Se requiere ALLOW_DEMO=true y una base de prueba vacía.");
const names = [
  "Proyector",
  "Mobiliario",
  "Instalación eléctrica",
  "Sanitarios",
  "Red o conectividad",
  "Otro",
];
try {
  await tx(async (c) => {
    const [n] = await q(c, "SELECT COUNT(*) n FROM usuario");
    if (n.n) throw new Error("La base de demo debe estar vacía.");
    const hash = await argon2.hash("PruebaITT2026!", { type: argon2.argon2id });
    for (const [role, name, email, kind, identifier] of [
      [3, "Coordinación de infraestructura", "admin", "Personal", "ADM001"],
      [3, "Supervisión de mantenimiento", "supervisor", "Personal", "ADM002"],
      [2, "María López", "tecnico", "Personal", "TEC001"],
      [1, "Roberto González", "alumno", "Alumno", "23280182"],
      [1, "Ana Martínez", "docente", "Docente", "DOC001"],
      [1, "Luis Hernández", "otro", "Alumno", "23281758"],
    ])
      await q(
        c,
        "INSERT INTO usuario(rol_id,nombre,correo,tipo_persona,identificador,password_hash,estado_cuenta,cambio_obligatorio,creada_en,actualizada_en) VALUES(?,?,?,?,?,?,'Activa',0,UTC_TIMESTAMP(),UTC_TIMESTAMP())",
        [role, name, email + "@toluca.tecnm.mx", kind, identifier, hash],
      );
    await q(
      c,
      "INSERT INTO periodo_escolar(clave,nombre,fecha_inicio,fecha_fin) VALUES('2026-2','Agosto a diciembre de 2026','2026-08-01','2026-12-31')",
    );
    for (let k = 0; k < names.length; k++)
      await q(c, "INSERT INTO tipo_falla(clave,nombre) VALUES(?,?)", [
        "TF" + (k + 1),
        names[k],
      ]);
    for (const [key, name] of [
      ["T", "Sistemas Computacionales y TICs"],
      ["F", "Aulas de Sistemas"],
      ["B", "Centro de información"],
      ["H", "Cafetería"],
    ]) {
      const b = await q(c, "INSERT INTO edificio(clave,nombre) VALUES(?,?)", [
        key,
        name,
      ]);
      for (let j = 1; j <= 3; j++)
        await q(
          c,
          "INSERT INTO espacio(edificio_id,clave,nombre,mapa_x,mapa_y) VALUES(?,?,?,?,?)",
          [
            b.insertId,
            key + "-" + String(j).padStart(2, "0"),
            (key === "T" ? "Laboratorio " : "Espacio ") + j,
            { T: 0.8, F: 0.57, B: 0.76, H: 0.445 }[key],
            { T: 0.39, F: 0.53, B: 0.525, H: 0.525 }[key],
          ],
        );
    }
    const states = [
      "Pendiente",
      "En proceso",
      "En revisión",
      "Resuelto",
      "Cerrado",
      "Cancelado",
    ];
    for (let k = 0; k < 12; k++) {
      const state = states[k % 6],
        age = 48 + k * 8,
        space = (k % 12) + 1,
        type = (k % 6) + 1,
        r = await q(
          c,
          `INSERT INTO incidencia(folio,reportante_id,espacio_id,tipo_falla_id,periodo_id,descripcion,estado,prioridad,creada_en,resuelta_en,cerrada_en) VALUES(?,?,?,?,1,?,?,?,DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? HOUR),${["Resuelto", "Cerrado"].includes(state) ? "DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 HOUR)" : "NULL"},${state === "Cerrado" ? "UTC_TIMESTAMP()" : "NULL"})`,
          [
            "ITT-DEMO-" + String(k + 1).padStart(4, "0"),
            4,
            space,
            type,
            [
              "El proyector no enciende al iniciar la clase y requiere revisión.",
              "La silla del espacio tiene una pata rota y no se puede utilizar.",
              "El contacto eléctrico presenta una falla intermitente.",
              "Se presenta una fuga de agua que requiere atención.",
              "La conexión de red no permite acceder a los servicios.",
              "La puerta no cierra correctamente desde esta mañana.",
            ][k % 6],
            state,
            ["Alta", "Media", "Baja"][k % 3],
            age,
          ],
        );
      const e = await q(
        c,
        "INSERT INTO evento_incidencia(incidencia_id,autor_id,tipo,estado_anterior,estado_nuevo,motivo,visibilidad,creado_en) VALUES(?,4,'Registro',NULL,'Pendiente','Incidencia de demostración','Pública',DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? HOUR))",
        [r.insertId, age],
      );
      await q(
        c,
        "INSERT INTO notificacion(evento_id,destinatario_id) VALUES(?,4)",
        [e.insertId],
      );
      if (state !== "Pendiente") {
        await q(
          c,
          `INSERT INTO asignacion(incidencia_id,tecnico_id,asignada_por,inicio_en,fin_en,motivo) VALUES(?,3,1,DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? HOUR),${["Cerrado", "Cancelado"].includes(state) ? "UTC_TIMESTAMP()" : "NULL"},'Asignación de demostración')`,
          [r.insertId, age - 1],
        );
        if (["En revisión", "Resuelto", "Cerrado"].includes(state))
          await q(
            c,
            "INSERT INTO intervencion(incidencia_id,autor_id,tipo,texto,visibilidad,creada_en) VALUES(?,3,'Solución','Se reemplazó el componente y se verificó el funcionamiento.','Pública',DATE_SUB(UTC_TIMESTAMP(),INTERVAL 3 HOUR))",
            [r.insertId],
          );
      }
    }
  });
  console.log(
    "Demo lista. Cuentas admin, supervisor, tecnico, alumno, docente y otro @toluca.tecnm.mx. Contraseña: PruebaITT2026!",
  );
} finally {
  await pool.end();
}
