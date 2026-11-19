import { query as q } from "../server/db.js";

// El tipo más frecuente cambia entre semestres; los casos adicionales varían por mes.
const semesters = [
  [2024, 1, [4, 2, 2, 1, 1, 1]],
  [2024, 2, [2, 5, 1, 1, 2, 1]],
  [2025, 1, [2, 1, 2, 1, 6, 1]],
  [2025, 2, [2, 1, 6, 2, 1, 1]],
];
const examples = [
  [
    ["T-01", "T-02", "F-01", "F-02"],
    [
      "El proyector enciende, pero no muestra imagen.",
      "La proyección pierde la señal durante la clase.",
    ],
  ],
  [
    ["F-02", "F-03", "B-01", "H-02"],
    [
      "Una silla está floja y requiere ajuste.",
      "Una mesa del espacio tiene la cubierta dañada.",
    ],
  ],
  [
    ["T-01", "F-03", "B-03", "H-01"],
    [
      "Un contacto dejó de suministrar energía.",
      "La luminaria del área parpadea al encenderla.",
    ],
  ],
  [
    ["H-03", "B-02", "F-01", "H-01"],
    [
      "Se observó una fuga de agua en el lavamanos.",
      "Se reportó una obstrucción en el desagüe.",
    ],
  ],
  [
    ["T-01", "T-03", "B-03", "T-02"],
    [
      "La red del espacio se desconecta durante el uso.",
      "El equipo dejó de reconocer la conexión de red.",
    ],
  ],
  [
    ["B-01", "F-02", "H-02", "T-03"],
    [
      "La puerta del espacio se atora al abrirla.",
      "El pestillo de una ventana requiere revisión.",
    ],
  ],
];

export async function agregarHistoricoDemo(c) {
  const accounts = await q(
    c,
    "SELECT id, identificador FROM usuario WHERE identificador IN ('DEMO-ADM1','DEMO-TEC1','DEMO-DOC1','00000002')",
  );
  const users = new Map(accounts.map((user) => [user.identificador, user.id]));
  if (users.size !== 4)
    throw new Error("El histórico requiere las cuentas de la demo inicial.");

  const types = new Map(
    (await q(c, "SELECT id, clave FROM tipo_falla")).map((row) => [
      row.clave,
      row.id,
    ]),
  );
  const spaces = new Map(
    (await q(c, "SELECT id, clave FROM espacio")).map((row) => [
      row.clave,
      row.id,
    ]),
  );
  if (
    examples.some(
      ([rooms], index) =>
        !types.has("TF" + (index + 1)) ||
        rooms.some((room) => !spaces.has(room)),
    )
  )
    throw new Error(
      "El histórico requiere el catálogo de espacios y fallas de la demo.",
    );

  const existing = new Set(
    (
      await q(c, "SELECT folio FROM incidencia WHERE folio LIKE 'ITT-HIST-%'")
    ).map((row) => row.folio),
  );
  const admin = users.get("DEMO-ADM1"),
    tech = users.get("DEMO-TEC1");
  let created = 0;

  for (const [year, semester, counts] of semesters) {
    const from = semester === 1 ? 1 : 7;
    const key = `DEMO-${year}-S${semester}`;
    const name = `Histórico demo ${year} · semestre ${semester}`;
    const start = `${year}-${semester === 1 ? "01" : "07"}-01`;
    const end = `${year}-${semester === 1 ? "06-30" : "12-31"}`;
    const [saved] = await q(
      c,
      "SELECT id, nombre, fecha_inicio, fecha_fin, activo FROM periodo_escolar WHERE clave=?",
      [key],
    );
    if (
      saved &&
      (saved.nombre !== name ||
        saved.fecha_inicio !== start ||
        saved.fecha_fin !== end ||
        saved.activo)
    )
      throw new Error(
        "Existe un periodo incompatible con el histórico demo: " + key,
      );
    const periodId =
      saved?.id ??
      (
        await q(
          c,
          "INSERT INTO periodo_escolar(clave,nombre,fecha_inicio,fecha_fin,activo) VALUES(?,?,?,?,0)",
          [key, name, start, end],
        )
      ).insertId;

    for (let month = from; month < from + 6; month++) {
      const monthKey = year + String(month).padStart(2, "0");
      const typesThisMonth = counts.flatMap((count, index) =>
        Array(count).fill(index),
      );
      for (let extra = 0; extra < month % 4; extra++)
        typesThisMonth.push((month + extra * 2) % examples.length);

      for (const [index, type] of typesThisMonth.entries()) {
        const folio = `ITT-HIST-${monthKey}-${String(index + 1).padStart(2, "0")}`;
        if (existing.has(folio)) continue;

        const [rooms, descriptions] = examples[type];
        const description = descriptions[(month + index) % descriptions.length];
        const base = Date.UTC(year, month - 1, 2 + index, 15 + (index % 7));
        const time = (hours) => new Date(base + hours * 3600000);
        const duration = 24 + ((index * 7 + month * 9) % 105);
        const cancelled = (index + month) % 11 === 0;
        const reportante = users.get(index % 2 ? "DEMO-DOC1" : "00000002");
        const { insertId } = await q(
          c,
          "INSERT INTO incidencia(folio,reportante_id,espacio_id,tipo_falla_id,periodo_id,descripcion,estado,prioridad,creada_en,resuelta_en,cerrada_en) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          [
            folio,
            reportante,
            spaces.get(rooms[(month + index) % rooms.length]),
            types.get("TF" + (type + 1)),
            periodId,
            "Demostración histórica. " + description,
            cancelled ? "Cancelado" : "Cerrado",
            ["Media", "Baja", "Alta"][index % 3],
            time(0),
            cancelled ? null : time(duration),
            cancelled ? null : time(duration + 12),
          ],
        );
        const record = (actor, action, before, after, note, hours) =>
          q(
            c,
            "INSERT INTO evento_incidencia(incidencia_id,autor_id,tipo,estado_anterior,estado_nuevo,motivo,visibilidad,creado_en) VALUES(?,?,?,?,?,?,'Pública',?)",
            [insertId, actor, action, before, after, note, time(hours)],
          );
        await record(
          reportante,
          "Registro",
          null,
          "Pendiente",
          "Caso ficticio del histórico de demostración.",
          0,
        );
        created++;
        if (cancelled) {
          await record(
            admin,
            "cancelar",
            "Pendiente",
            "Cancelado",
            "Se comprobó que el aviso de ejemplo ya no requería atención.",
            8,
          );
          continue;
        }

        await q(
          c,
          "INSERT INTO asignacion(incidencia_id,tecnico_id,asignada_por,inicio_en,fin_en,motivo) VALUES(?,?,?,?,?,?)",
          [
            insertId,
            tech,
            admin,
            time(4),
            time(duration + 12),
            "Asignación del histórico de demostración.",
          ],
        );
        await record(
          admin,
          "Asignación",
          "Pendiente",
          "En proceso",
          "Se asignó al técnico de demostración.",
          4,
        );
        for (const [kind, note, hours, next] of [
          [
            "Diagnóstico",
            "Se inspeccionó el elemento señalado en el reporte.",
            12,
            "En proceso",
          ],
          [
            "Solución",
            "Se corrigió la falla y se comprobó el funcionamiento en el espacio.",
            duration - 6,
            "En revisión",
          ],
        ]) {
          await q(
            c,
            "INSERT INTO intervencion(incidencia_id,autor_id,tipo,texto,visibilidad,creada_en) VALUES(?,?,?,?,'Pública',?)",
            [insertId, tech, kind, note, time(hours)],
          );
          await record(tech, kind, "En proceso", next, note, hours);
        }
        await record(
          admin,
          "aprobar",
          "En revisión",
          "Resuelto",
          "Administración validó la solución.",
          duration,
        );
        await record(
          reportante,
          "cerrar",
          "Resuelto",
          "Cerrado",
          "El reportante confirmó el funcionamiento.",
          duration + 12,
        );
      }
    }
  }
  return created;
}
