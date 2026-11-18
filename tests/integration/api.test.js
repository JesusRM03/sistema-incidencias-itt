import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { app } from "../../server/app.js";
import { hmac } from "../../server/domain.js";
import { pool, query as q } from "../../server/db.js";
if (
  process.env.DB_NAME !== "incidencias_itt_demo" ||
  process.env.ALLOW_DEMO !== "true"
)
  throw new Error(
    "La suite modifica datos y requiere la base exclusiva de demostración.",
  );

let server, base;
const origin = process.env.APP_ORIGIN;
class Client {
  constructor() {
    this.cookies = {};
    this.csrf = "";
  }
  async call(path, method = "GET", body, headers = {}) {
    const res = await fetch(base + "/api" + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: Object.entries(this.cookies)
          .map(([k, v]) => k + "=" + v)
          .join("; "),
        "X-CSRF-Token": this.csrf,
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";"),
        pos = kv.indexOf("=");
      this.cookies[kv.slice(0, pos)] = kv.slice(pos + 1);
    }
    const content = res.headers.get("content-type") || "";
    const d = content.includes("json") ? await res.json() : await res.text();
    if (d.csrf) this.csrf = d.csrf;
    return { status: res.status, data: d };
  }
  async login(email) {
    const r = await this.call("/acceso", "POST", {
      correo: email + "@toluca.tecnm.mx",
      password: process.env["DEMO_PASSWORD_" + email.toUpperCase()],
    });
    assert.equal(r.status, 200, r.data?.message);
    return this;
  }
}
let admin, tech, owner, other, supervisor, inc, key, payload, photoID;
const fresh = async (c = admin) => (await c.call("/incidencias/" + inc)).data;
const action = async (c, accion, extra = {}) => {
  const i = await fresh(c);
  return c.call("/incidencias/" + inc + "/acciones", "POST", {
    accion,
    version: i.version,
    motivo: "Comprobación automatizada de la acción",
    ...extra,
  });
};
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port;
  admin = await new Client().login("admin");
  supervisor = await new Client().login("supervisor");
  tech = await new Client().login("tecnico");
  owner = await new Client().login("alumno");
  other = await new Client().login("otro");
});
after(async () => {
  try {
    await fs.mkdir("artifacts", { recursive: true });
    await fs.writeFile(
      "artifacts/integration-context.json",
      JSON.stringify({ inc }),
    );
  } finally {
    await new Promise((r) => server.close(r));
    await pool.end();
  }
});
test("Base relacional contiene las 19 tablas", async () => {
  const rows = await q(pool, "SHOW TABLES");
  assert.equal(rows.length, 19);
});
test("RF-10 sin sesión rechaza catálogo", async () =>
  assert.equal((await new Client().call("/catalogos")).status, 401));
test("RF-10 reportante no administra cuentas", async () =>
  assert.equal((await owner.call("/usuarios")).status, 403));
test("CSRF rechaza escritura de origen ajeno", async () =>
  assert.equal(
    (
      await owner.call(
        "/sesion/cerrar",
        "POST",
        {},
        { Origin: "https://ajeno.example" },
      )
    ).status,
    403,
  ));
test("CSRF rechaza token incorrecto", async () =>
  assert.equal(
    (
      await owner.call(
        "/sesion/cerrar",
        "POST",
        {},
        { "X-CSRF-Token": "incorrecto" },
      )
    ).status,
    403,
  ));
test("RF-04 descripción menor de 20 rechazada", async () =>
  assert.equal(
    (
      await owner.call(
        "/incidencias",
        "POST",
        { espacio_id: 1, tipo_falla_id: 1, descripcion: "Falla" },
        { "Idempotency-Key": crypto.randomUUID() },
      )
    ).status,
    422,
  ));
test("RF-16 carga de imagen real y alta con periodo", async () => {
  const bytes = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#557755" },
  })
    .png()
    .toBuffer();
  key = crypto.randomUUID();
  payload = {
    espacio_id: 2,
    tipo_falla_id: 4,
    descripcion: "Prueba de una falla distinta en el mobiliario del espacio.",
    diferencia_duplicado: "Ensayo independiente de esta falla.",
    fotos: [{ data: bytes.toString("base64") }],
  };
  const r = await owner.call("/incidencias", "POST", payload, {
    "Idempotency-Key": key,
  });
  assert.equal(r.status, 201, JSON.stringify(r));
  inc = r.data.id;
  const i = await fresh(owner);
  assert.equal(i.estado, "Pendiente");
  assert.equal(i.periodo_id, 1);
  photoID = i.evidencias[0].id;
});
test("RF-29 reintento devuelve mismo ID", async () => {
  const r = await owner.call("/incidencias", "POST", payload, {
    "Idempotency-Key": key,
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.id, inc);
});
test("RF-29 misma clave y otro contenido genera conflicto", async () =>
  assert.equal(
    (
      await owner.call(
        "/incidencias",
        "POST",
        { ...payload, descripcion: payload.descripcion + " adicional" },
        { "Idempotency-Key": key },
      )
    ).status,
    409,
  ));
test("RF-17 duplicado exige explicación sin revelar identidad", async () => {
  const r = await owner.call(
    "/incidencias",
    "POST",
    { ...payload, fotos: [], diferencia_duplicado: "" },
    { "Idempotency-Key": crypto.randomUUID() },
  );
  assert.equal(r.status, 409);
  assert.deepEqual(Object.keys(r.data.coincidencias[0]).sort(), [
    "creada_en",
    "estado",
    "folio",
  ]);
});
test("RF-05 reportante ajeno no ve detalle", async () =>
  assert.equal((await other.call("/incidencias/" + inc)).status, 404));
test("RF-05 técnico no asignado no ve detalle", async () =>
  assert.equal((await tech.call("/incidencias/" + inc)).status, 404));
test("RNF-12 descarga ajena de fotografía rechazada", async () =>
  assert.equal((await other.call("/evidencias/" + photoID)).status, 404));
test("RF-16 imagen corrupta no guarda incidencia", async () => {
  const [before] = await q(pool, "SELECT COUNT(*) n FROM incidencia");
  const r = await owner.call(
    "/incidencias",
    "POST",
    {
      espacio_id: 3,
      tipo_falla_id: 6,
      descripcion:
        "Otra falla con una evidencia corrupta para comprobar rechazo.",
      fotos: [{ data: Buffer.from("no es una imagen").toString("base64") }],
    },
    { "Idempotency-Key": crypto.randomUUID() },
  );
  assert.equal(r.status, 422);
  const [after] = await q(pool, "SELECT COUNT(*) n FROM incidencia");
  assert.equal(after.n, before.n);
});
test("RF-07 primera asignación inicia atención", async () => {
  const i = await fresh();
  const r = await admin.call("/incidencias/" + inc + "/asignaciones", "POST", {
    version: i.version,
    tecnico_id: 3,
    motivo: "Atención por especialidad",
  });
  assert.equal(r.status, 200, JSON.stringify(r));
  assert.equal((await fresh()).estado, "En proceso");
});
test("RNF-11 versión antigua impide sobrescritura", async () =>
  assert.equal(
    (
      await admin.call("/incidencias/" + inc + "/asignaciones", "POST", {
        version: 1,
        tecnico_id: 3,
        motivo: "Versión vieja",
      })
    ).status,
    409,
  ));
test("RF-25 no desactiva técnico con tareas", async () => {
  const u = (await admin.call("/usuarios")).data.find((x) => x.id === 3);
  assert.equal(
    (
      await admin.call("/usuarios/3", "PATCH", {
        version: u.version,
        estado_cuenta: "Inactiva",
        motivo: "Prueba de bloqueo",
      })
    ).status,
    409,
  );
});
test("RF-19 nota interna guardada y oculta al reportante", async () => {
  const i = await fresh(tech),
    r = await tech.call("/incidencias/" + inc + "/intervenciones", "POST", {
      version: i.version,
      tipo: "Diagnóstico",
      texto: "Diagnóstico privado de mantenimiento.",
      visibilidad: "Interna",
    });
  assert.equal(r.status, 201, JSON.stringify(r));
  assert.equal((await fresh(owner)).intervenciones.length, 0);
  assert.equal((await fresh(tech)).intervenciones.length, 1);
});
test("RF-18 técnico no puede priorizar", async () =>
  assert.equal(
    (await action(tech, "priorizar", { prioridad: "Alta" })).status,
    403,
  ));
test("RF-20 técnico envía solución a revisión", async () => {
  const i = await fresh(tech),
    r = await tech.call("/incidencias/" + inc + "/intervenciones", "POST", {
      version: i.version,
      tipo: "Solución",
      texto: "Reparación terminada y comprobada en el espacio.",
      visibilidad: "Pública",
    });
  assert.equal(r.status, 201, JSON.stringify(r));
  assert.equal((await fresh()).estado, "En revisión");
});
test("RF-20 técnico no aprueba su solución", async () =>
  assert.equal((await action(tech, "aprobar")).status, 403));
test("RF-20 administrador aprueba solución de otra persona", async () => {
  assert.equal((await action(admin, "aprobar")).status, 200);
  assert.equal((await fresh()).estado, "Resuelto");
});
test("RF-21 técnico no cierra por su rol", async () =>
  assert.equal((await action(tech, "cerrar")).status, 403));
test("RF-22 inconformidad limpia aprobación y reabre", async () => {
  assert.equal((await action(owner, "inconformidad")).status, 200);
  const i = await fresh();
  assert.equal(i.estado, "En proceso");
  assert.equal(i.resuelta_en, null);
});
test("RF-20 aprobación propia administrativa bloqueada", async () => {
  const i = await fresh();
  const r = await admin.call(
    "/incidencias/" + inc + "/intervenciones",
    "POST",
    {
      version: i.version,
      tipo: "Solución",
      texto: "Se corrigió la falla reportada nuevamente.",
      visibilidad: "Pública",
      motivo: "Sustitución excepcional por administración",
    },
  );
  assert.equal(r.status, 201);
  assert.equal((await action(admin, "aprobar")).status, 403);
  assert.equal((await action(supervisor, "aprobar")).status, 200);
});
test("RF-21 reportante confirma cierre", async () => {
  assert.equal((await action(owner, "cerrar")).status, 200);
  const i = await fresh();
  assert.equal(i.estado, "Cerrado");
  assert.ok(i.cerrada_en);
  assert.equal(i.tecnico_id, null);
});
test("RD-09 cerrado terminal no permite cancelación", async () =>
  assert.equal((await action(admin, "cancelar")).status, 409));
test("RF-26 periodos superpuestos rechazados", async () =>
  assert.equal(
    (
      await admin.call("/catalogos/periodo_escolar", "POST", {
        clave: "OVERLAP",
        nombre: "Periodo superpuesto",
        fecha_inicio: "2026-10-01",
        fecha_fin: "2027-01-01",
        activo: 1,
        motivo: "Prueba de superposición",
      })
    ).status,
    409,
  ));
test("RF-13 baja de edificio con espacios activos rechazada", async () =>
  assert.equal(
    (
      await admin.call("/catalogos/edificio/1", "PATCH", {
        activo: 0,
        motivo: "Prueba de dependencias",
      })
    ).status,
    409,
  ));
let previousQR;
test("RF-28 etiqueta QR sin identidad", async () => {
  const r = await admin.call("/espacios/1/qr", "POST", {});
  assert.equal(r.status, 200);
  previousQR = new URL(r.data.url).searchParams.get("qr");
  assert.equal((await new Client().call("/qr/" + previousQR)).status, 401);
  const out = await owner.call("/qr/" + previousQR);
  assert.equal(out.status, 200);
  assert.equal(out.data.id, 1);
  assert.ok(!("correo" in out.data));
});
test("RF-28 renovación invalida QR anterior", async () => {
  const r = await admin.call("/espacios/1/qr", "POST", {
    renovar: true,
    motivo: "Sustitución de etiqueta",
  });
  assert.equal(r.status, 200);
  assert.equal((await owner.call("/qr/" + previousQR)).status, 410);
});
test("RF-12 filtros se intersectan y conservan paginación", async () => {
  const r = await admin.call(
    "/incidencias?estado=Cerrado&espacio_id=2&tipo_falla_id=4",
  );
  assert.equal(r.status, 200);
  assert.ok(r.data.items.length);
  assert.ok(
    r.data.items.every(
      (i) =>
        i.estado === "Cerrado" && i.espacio_id === 2 && i.tipo_falla_id === 4,
    ),
  );
  assert.ok(r.data.paginas >= 1);
});
test("RF-12 fechas invertidas rechazadas", async () =>
  assert.equal(
    (await admin.call("/incidencias?desde=2026-12-01&hasta=2026-01-01")).status,
    422,
  ));
test("RF-24 CSV y panel comparten registros y columnas", async () => {
  const r = await admin.call("/reportes?estado=Cerrado"),
    csv = await admin.call("/reportes.csv?estado=Cerrado");
  assert.equal(csv.status, 200);
  assert.equal(csv.data.trim().split("\r\n").length, r.data.total + 1);
  for (const col of r.data.columns)
    assert.ok(csv.data.includes('"' + r.data.labels[col] + '"'));
});
test("RF-11 lectura individual no modifica aviso ajeno", async () => {
  const notices = (await owner.call("/notificaciones")).data;
  const n = notices.find((x) => x.incidencia_id === inc);
  assert.ok(n);
  assert.equal(
    (await other.call("/notificaciones/" + n.id + "/leer", "POST", {})).status,
    404,
  );
  assert.equal(
    (await owner.call("/notificaciones/" + n.id + "/leer", "POST", {})).status,
    200,
  );
});
let recoveryUser, recoveryToken;
const recoveryEmail = "ensayo-" + crypto.randomUUID() + "@toluca.tecnm.mx";
const recoveryIdentifier = "QA-" + randomBytes(6).toString("hex");

test("RF-01 alta administrativa entrega credencial temporal", async () => {
  const r = await admin.call("/usuarios", "POST", {
    nombre: "Prueba de recuperación",
    correo: recoveryEmail,
    identificador: recoveryIdentifier,
    tipo_persona: "Personal",
    rol_id: 1,
    motivo: "Identidad comprobada para prueba",
  });
  assert.equal(r.status, 201);
  recoveryUser = r.data.id;
  recoveryToken = r.data.credencial;
  assert.equal(recoveryToken.length, 64);
});
test("RF-01 correo duplicado rechazado", async () =>
  assert.equal(
    (
      await admin.call("/usuarios", "POST", {
        nombre: "Duplicada",
        correo: recoveryEmail,
        identificador: recoveryIdentifier,
        tipo_persona: "Personal",
        rol_id: 1,
        motivo: "Prueba de duplicación",
      })
    ).status,
    409,
  ));
test("RF-27 canje con CAPTCHA activa cuenta y no permite segundo uso", async () => {
  const c = new Client(),
    cap = await c.call("/captcha?proposito=Cambio%20inicial");
  assert.equal(cap.status, 200);
  assert.ok(cap.data.imagen.startsWith("data:image/png;base64,"));
  async function fixedAnswer(rid) {
    // Set a known answer only in the disposable database. The deployed CAPTCHA is unchanged.
    const answer = String(Math.floor(10000 + Math.random() * 90000));
    await q(pool, "UPDATE reto_captcha SET respuesta_hmac=? WHERE id=?", [
      hmac(answer),
      rid,
    ]);
    return answer;
  }
  const answer = await fixedAnswer(cap.data.id),
    newPassword = "Aa1" + randomBytes(20).toString("hex");
  const body = {
    token: recoveryToken,
    password: newPassword,
    confirmacion: newPassword,
    captcha_id: cap.data.id,
    captcha_respuesta: answer,
  };
  const r = await c.call("/credenciales/canjear", "POST", body);
  assert.equal(r.status, 200, JSON.stringify(r));
  const cap2 = await c.call("/captcha?proposito=Cambio%20inicial"),
    answer2 = await fixedAnswer(cap2.data.id);
  assert.equal(
    (
      await c.call("/credenciales/canjear", "POST", {
        ...body,
        captcha_id: cap2.data.id,
        captcha_respuesta: answer2,
      })
    ).status,
    422,
  );
  const [u] = await q(pool, "SELECT password_hash FROM usuario WHERE id=?", [
    recoveryUser,
  ]);
  assert.ok(u.password_hash.startsWith("$argon2id$"));
});
test("RNF-04 inactividad de 30 minutos revoca acceso", async () => {
  const c = await new Client().login("docente");
  await q(
    pool,
    "UPDATE sesion SET ultima_actividad_en=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 31 MINUTE) WHERE usuario_id=5",
  );
  assert.equal((await c.call("/catalogos")).status, 401);
});
test("RF-03 cerrar sesión impide reutilización", async () => {
  const c = await new Client().login("docente"),
    cookie = c.cookies.itt_session;
  assert.equal((await c.call("/sesion/cerrar", "POST", {})).status, 200);
  c.cookies.itt_session = cookie;
  assert.equal((await c.call("/catalogos")).status, 401);
});
test("RNF-05 auditoría no contiene hashes ni secretos", async () => {
  const r = await admin.call("/auditoria");
  assert.equal(r.status, 200);
  const json = JSON.stringify(r.data);
  assert.ok(!json.includes(recoveryToken));
  assert.ok(!json.includes("$argon2"));
  assert.ok(!json.includes("password"));
});

test("RF-30 vincula duplicado mediante el folio visible y conserva ambos registros", async () => {
  const r = await owner.call(
    "/incidencias",
    "POST",
    {
      espacio_id: 12,
      tipo_falla_id: 3,
      descripcion:
        "Reporte adicional para verificar la vinculación administrativa por folio.",
    },
    { "Idempotency-Key": crypto.randomUUID() },
  );
  assert.equal(r.status, 201);
  const result = await admin.call(
    "/incidencias/" + r.data.id + "/acciones",
    "POST",
    {
      accion: "duplicado",
      version: 1,
      principal_folio: "ITT-DEMO-0001",
      motivo: "Coincidencia confirmada con el reporte principal",
    },
  );
  assert.equal(result.status, 200, JSON.stringify(result));
  const out = (await admin.call("/incidencias/" + r.data.id)).data;
  assert.equal(out.estado, "Cancelado");
  assert.equal(out.principal_id, 1);
  assert.equal((await admin.call("/incidencias/1")).status, 200);
});

test("Alta concurrente con foto confirma un solo folio, evento y archivo", async () => {
  const uuid = crypto.randomUUID(),
    body = {
      ...payload,
      diferencia_duplicado: "Se revisa otro equipo del salón.",
    };
  const create = () =>
    owner.call("/incidencias", "POST", body, { "Idempotency-Key": uuid });
  const both = await Promise.all([create(), create()]);
  assert.deepEqual(both.map((r) => r.status).sort(), [200, 201]);
  assert.equal(both[0].data.folio, both[1].data.folio);
  const detail = (await owner.call("/incidencias/" + both[0].data.id)).data;
  assert.equal(detail.evidencias.length, 1);
  assert.equal(detail.historial.length, 1);
});
test("Altas aceptan cinco fotos y rechazan una sexta y archivos mayores de 5 MB", async () => {
  const png = payload.fotos[0],
    base = {
      ...payload,
      diferencia_duplicado: "Corresponde a una segunda falla comprobada.",
    };
  const create = (fotos) =>
    other.call(
      "/incidencias",
      "POST",
      { ...base, fotos },
      { "Idempotency-Key": crypto.randomUUID() },
    );
  assert.equal((await create(Array(6).fill(png))).status, 422);
  assert.equal(
    (await create([{ data: Buffer.alloc(5000001).toString("base64") }])).status,
    422,
  );
  const five = await create(Array(5).fill(png));
  assert.equal(five.status, 201);
  assert.equal(
    (await other.call("/incidencias/" + five.data.id)).data.evidencias.length,
    5,
  );
});
test("Totales por estado aplican el ámbito de usuario y superan las veinte filas visibles", async () => {
  const body = {
    ...payload,
    fotos: [],
    diferencia_duplicado: "Este ensayo corresponde a una prueba individual.",
  };
  for (let n = 0; n < 21; n++) {
    const result = await other.call("/incidencias", "POST", body, {
      "Idempotency-Key": crypto.randomUUID(),
    });
    assert.equal(result.status, 201);
  }
  const list = (await other.call("/incidencias?pagina=2")).data;
  const [expected] = await q(
    pool,
    "SELECT COUNT(*) n FROM incidencia WHERE reportante_id=6 AND estado='Pendiente'",
  );
  assert.ok(list.total > 20);
  assert.ok(list.items.every((item) => item.reportante_id === 6));
  assert.equal(
    list.porEstado.find((s) => s.nombre === "Pendiente").total,
    expected.n,
  );
});
test("QR preasignado a espacio nuevo, redescarga estable y área general independiente", async () => {
  const b = await admin.call("/catalogos/edificio", "POST", {
    clave: "QA-" + randomBytes(4).toString("hex"),
    nombre: "Edificio de ensayo",
    activo: 1,
    motivo: "Ensayo de catálogo",
  });
  assert.equal(b.status, 201);
  const s = await admin.call("/catalogos/espacio", "POST", {
    edificio_id: b.data.id,
    clave: "QA",
    nombre: "Espacio de ensayo",
    activo: 1,
    motivo: "Alta autorizada para prueba",
  });
  assert.equal(s.status, 201);
  const [count] = await q(
    pool,
    "SELECT COUNT(*) n FROM codigo_qr WHERE espacio_vigente=?",
    [s.data.id],
  );
  assert.equal(count.n, 1);
  const emit = (route) => admin.call(route, "POST", {});
  const room = (await emit("/espacios/" + s.data.id + "/qr")).data;
  const [g, h] = await Promise.all([
    emit("/edificios/" + b.data.id + "/qr"),
    emit("/edificios/" + b.data.id + "/qr"),
  ]);
  assert.equal(g.status, 200);
  assert.equal(h.data.url, g.data.url);
  assert.notEqual(room.url, g.data.url);
  assert.equal(
    room.url,
    (await emit("/espacios/" + s.data.id + "/qr")).data.url,
  );
  assert.equal(
    (await owner.call("/qr/" + new URL(g.data.url).searchParams.get("qr"))).data
      .nombre,
    "Área general del edificio",
  );
});
test("Estadísticas combinadas de edificio y periodo concuerdan con los detalles", async () => {
  const data = (await admin.call("/reportes?edificio_id=1&periodo_id=1")).data;
  assert.ok(data.total > 0);
  for (const group of [
    data.porEdificio,
    data.porPeriodo,
    data.porEstado,
    data.porTipo,
    data.porTecnico,
  ])
    assert.equal(
      group.reduce((n, row) => n + row.total, 0),
      data.total,
    );
  assert.equal(data.porEdificio.length, 1);
  assert.equal(data.porPeriodo.length, 1);
});

test("El bloqueo por cuenta no se comparte por IP ni se prolonga al reintentar", async () => {
  const correo = "prueba-" + randomBytes(8).toString("hex") + "@toluca.tecnm.mx";
  const account = hmac(correo);
  const [{ origen_hmac: originHash }] = await q(pool,
    "SELECT origen_hmac FROM intento_acceso WHERE cuenta_hmac=? AND resultado='Correcto' ORDER BY id DESC LIMIT 1",
    [hmac("admin@toluca.tecnm.mx")]);
  for (let i = 0; i < 5; i++)
    await q(pool, "INSERT INTO intento_acceso(cuenta_hmac,origen_hmac,resultado,ocurrido_en) VALUES(?,?,'Fallido',UTC_TIMESTAMP() - INTERVAL 13 MINUTE)", [account, originHash]);
  const c = new Client();
  for (let i = 0; i < 6; i++) {
    const response = await c.call("/acceso", "POST", { correo });
    assert.equal(response.status, 429);
    assert.match(response.data.message, /[12] minutos?\./);
  }
  await new Client().login("admin");
  await new Client().login("tecnico");
  await q(pool, "UPDATE intento_acceso SET ocurrido_en=UTC_TIMESTAMP()-INTERVAL 16 MINUTE WHERE cuenta_hmac=? AND resultado='Fallido'", [account]);
  assert.equal((await c.call("/acceso","POST",{correo})).status,401);
});
