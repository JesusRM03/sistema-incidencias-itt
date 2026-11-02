import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import argon2 from "argon2";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import QRCode from "qrcode";
import { pool, query as q, transaction as tx } from "./db.js";
import {
  HttpError,
  check,
  text,
  id,
  sha,
  token,
  hmac,
  transition,
  validateUser,
  password,
  safeUser,
  csvCell,
  meanHours,
  canonical,
} from "./domain.js";
const run = promisify(execFile);
export const app = express();
const origin = process.env.APP_ORIGIN || "http://localhost:5173",
  secure = process.env.COOKIE_SECURE === "true",
  files = path.resolve(process.env.PRIVATE_FILES || "var/evidencias");
check(
  process.env.APP_SECRET?.length >= 32 &&
    !process.env.APP_SECRET.includes("CAMBIAR"),
  "APP_SECRET debe tener al menos 32 caracteres.",
  500,
);
check(
  process.env.NODE_ENV !== "production" ||
    (secure && origin.startsWith("https://")),
  "Producción requiere cookies seguras y HTTPS.",
  500,
);
check(
  path.relative(path.resolve("dist"), files).startsWith(".." + path.sep) ||
    path.isAbsolute(path.relative(path.resolve("dist"), files)),
  "El directorio privado no puede estar dentro del sitio público.",
  500,
);
await fs.mkdir(files, { recursive: true });
app.disable("x-powered-by");
app.set("trust proxy", false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        mediaSrc: ["'self'", "blob:", "data:"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "36mb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(req.method) && req.get("Origin") !== origin)
    return next(new HttpError(403, "Origen no autorizado."));
  next();
});
const api = express.Router();
app.use("/api", api);
const cookieOpts = { httpOnly: true, secure, sameSite: "strict", path: "/api" };
const publicProfile = (u) => safeUser(u);
const nowSQL = "UTC_TIMESTAMP(6)";
async function audit(
  c,
  u,
  entity,
  rid,
  action,
  reason,
  before = null,
  after = null,
) {
  await q(
    c,
    `INSERT INTO auditoria_admin(actor_id,entidad,recurso_id,accion,motivo,antes,despues,creada_en) VALUES(?,?,?,?,?,?,?,${nowSQL})`,
    [
      u.id,
      entity,
      String(rid),
      action,
      text(reason, 3, 1000, "Motivo"),
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
    ],
  );
}
async function event(
  c,
  u,
  i,
  type,
  old,
  reason,
  visibility = "Pública",
  detail = null,
) {
  const r = await q(
    c,
    `INSERT INTO evento_incidencia(incidencia_id,autor_id,tipo,estado_anterior,estado_nuevo,motivo,visibilidad,detalle,creado_en) VALUES(?,?,?,?,?,?,?,?,${nowSQL})`,
    [
      i.id,
      u.id,
      type,
      old || null,
      i.estado,
      reason || null,
      visibility,
      detail ? JSON.stringify(detail) : null,
    ],
  );
  const recipients = await q(
    c,
    "SELECT id FROM usuario WHERE estado_cuenta='Activa' AND (rol_id=3 OR id=? OR id IN (SELECT tecnico_id FROM asignacion WHERE incidencia_id=? AND fin_en IS NULL))",
    [i.reportante_id, i.id],
  );
  for (const person of recipients) {
    if (
      visibility === "Interna" &&
      person.id === i.reportante_id &&
      person.id !== u.id
    ) {
      const [p] = await q(c, "SELECT rol_id FROM usuario WHERE id=?", [
        person.id,
      ]);
      if (p.rol_id === 1) continue;
    }
    await q(
      c,
      "INSERT IGNORE INTO notificacion(evento_id,destinatario_id) VALUES(?,?)",
      [r.insertId, person.id],
    );
  }
}
async function auth(req, res, next) {
  try {
    const raw = req.cookies.itt_session;
    check(raw, "Inicia sesión para continuar.", 401);
    const [u] = await q(
      pool,
      `SELECT u.*,r.nombre rol,s.id session_id,s.ultima_actividad_en,s.revocada_en FROM sesion s JOIN usuario u ON u.id=s.usuario_id JOIN rol r ON r.id=u.rol_id WHERE s.token_hash=?`,
      [sha(raw)],
    );
    if (
      u &&
      !u.revocada_en &&
      Date.now() - Date.parse(u.ultima_actividad_en + "Z") >= 1800000
    )
      await q(
        pool,
        `UPDATE sesion SET revocada_en=UTC_TIMESTAMP(6) WHERE id=?`,
        [u.session_id],
      );
    check(
      u &&
        u.estado_cuenta === "Activa" &&
        !u.cambio_obligatorio &&
        !u.revocada_en &&
        Date.now() - Date.parse(u.ultima_actividad_en + "Z") < 1800000,
      "Tu sesión terminó. Inicia sesión nuevamente.",
      401,
    );
    await q(
      pool,
      `UPDATE sesion SET ultima_actividad_en=${nowSQL} WHERE id=?`,
      [u.session_id],
    );
    req.user = u;
    if (!["GET", "HEAD"].includes(req.method))
      check(
        req.get("X-CSRF-Token") ===
          crypto
            .createHmac("sha256", process.env.APP_SECRET)
            .update(raw)
            .digest("hex"),
        "Recarga la página e intenta nuevamente.",
        403,
      );
    next();
  } catch (e) {
    next(e);
  }
}
const admin = (req, res, next) =>
  req.user.rol_id === 3
    ? next()
    : next(new HttpError(403, "Esta acción requiere administración."));
async function canSee(c, u, i) {
  if (u.rol_id === 3 || i.reportante_id === u.id) return true;
  const a = await q(
    c,
    "SELECT id FROM asignacion WHERE incidencia_id=? AND tecnico_id=? AND fin_en IS NULL",
    [i.id, u.id],
  );
  return u.rol_id === 2 && a.length > 0;
}
async function incident(c, u, rid, lock = false) {
  const [i] = await q(
    c,
    "SELECT * FROM incidencia WHERE id=?" + (lock ? " FOR UPDATE" : ""),
    [id(rid)],
  );
  check(i && (await canSee(c, u, i)), "Incidencia no disponible.", 404);
  return i;
}
async function staff(c, u, i) {
  if (u.rol_id === 3) return true;
  const r = await q(
    c,
    "SELECT id FROM asignacion WHERE incidencia_id=? AND tecnico_id=? AND fin_en IS NULL",
    [i.id, u.id],
  );
  return u.rol_id === 2 && r.length > 0;
}
function version(i, d) {
  check(
    Number(d.version) === i.version,
    "La incidencia cambió. Recarga antes de continuar.",
    409,
  );
}
async function revoke(c, uid) {
  await q(
    c,
    `UPDATE sesion SET revocada_en=${nowSQL} WHERE usuario_id=? AND revocada_en IS NULL`,
    [uid],
  );
}
async function issueCredential(c, u, uid, purpose) {
  const t = token();
  await q(
    c,
    `UPDATE credencial_temporal SET revocada_en=${nowSQL} WHERE usuario_id=? AND usada_en IS NULL AND revocada_en IS NULL`,
    [uid],
  );
  await q(
    c,
    `INSERT INTO credencial_temporal(usuario_id,emitida_por,token_hash,proposito,emitida_en,vence_en) VALUES(?,?,?,?,${nowSQL},DATE_ADD(${nowSQL},INTERVAL 15 MINUTE))`,
    [uid, u.id, sha(t), purpose],
  );
  await q(c, "UPDATE usuario SET cambio_obligatorio=1 WHERE id=?", [uid]);
  await revoke(c, uid);
  return t;
}
// CAPTCHA is bound to a browser context and purpose, consumed even on an incorrect answer.
api.get("/captcha", async (req, res) => {
  const purpose =
      req.query.proposito === "Cambio inicial" ? "Cambio inicial" : "Acceso",
    ctx = req.cookies.itt_context || token(),
    answer = String(crypto.randomInt(10000, 100000)),
    rid = crypto.randomUUID();
  res.cookie("itt_context", ctx, { ...cookieOpts, maxAge: 900000 });
  await tx(
    async (c) => {
      await q(
        c,
        `UPDATE reto_captcha SET consumido_en=${nowSQL} WHERE contexto_hmac=? AND proposito=? AND consumido_en IS NULL`,
        [hmac(ctx), purpose],
      );
      await q(
        c,
        `INSERT INTO reto_captcha VALUES(?,?,?,?,${nowSQL},DATE_ADD(${nowSQL},INTERVAL 120 SECOND),NULL)`,
        [rid, hmac(ctx), purpose, hmac(answer)],
      );
    },
    "captcha:" + hmac(ctx).toString("hex").slice(0, 30),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64"><rect width="220" height="64" fill="#edf1ec"/><path d="M0 45L220 15M0 20L220 52" stroke="#9baea0"/><text x="26" y="46" font-family="monospace" font-size="36" letter-spacing="8" fill="#243c31">${answer}</text></svg>`;
  let audio = null;
  try {
    const wav = await run(
      process.env.ESPEAK_BINARY || "espeak-ng",
      ["-v", "es", "--stdout", answer.split("").join(" , ")],
      { encoding: "buffer", maxBuffer: 2000000 },
    );
    audio = "data:audio/wav;base64," + wav.stdout.toString("base64");
  } catch {
    /* The deployment check reports a missing audio synthesizer. */
  }
  res.json({
    id: rid,
    imagen:
      "data:image/png;base64," +
      (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64"),
    audio,
    venceEn: 120,
  });
});
async function consumeCaptcha(c, req, purpose) {
  const d = req.body,
    rows = await q(c, "SELECT * FROM reto_captcha WHERE id=? FOR UPDATE", [
      String(d.captcha_id || ""),
    ]),
    r = rows[0];
  if (!r) return { ok: false, rid: null };
  if (r.consumido_en) return { ok: false, rid: null };
  await q(c, `UPDATE reto_captcha SET consumido_en=${nowSQL} WHERE id=?`, [
    r.id,
  ]);
  return {
    rid: r.id,
    ok:
      r.proposito === purpose &&
      r.contexto_hmac.equals(hmac(req.cookies.itt_context || "")) &&
      Date.parse(r.vence_en + "Z") >= Date.now() &&
      r.respuesta_hmac.equals(hmac(String(d.captcha_respuesta || "").trim())),
  };
}
const dummyHash = await argon2.hash(token(), { type: argon2.argon2id });
api.post("/acceso", async (req, res) => {
  const correo = String(req.body.correo || "")
      .trim()
      .toLowerCase()
      .slice(0, 254),
    account = hmac(correo),
    source = hmac(req.ip);
  const result = await tx(
    async (c) => {
      const [fail] = await q(
        c,
        "SELECT COUNT(*) n FROM intento_acceso WHERE ocurrido_en>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE) AND resultado<>'Correcto' AND (cuenta_hmac=? OR origen_hmac=?)",
        [account, source],
      );
      const [u] = await q(
        c,
        "SELECT u.*,r.nombre rol FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE correo=?",
        [correo],
      );
      let status = 200,
        msg = "",
        rid = null,
        outcome = "Correcto";
      if (fail.n >= 5) {
        status = 429;
        msg = "Demasiados intentos. Espera 15 minutos.";
        outcome = "Limitado";
      } else if (fail.n >= 3) {
        const captcha = await consumeCaptcha(c, req, "Acceso");
        rid = captcha.rid;
        if (!captcha.ok) {
          status = 400;
          msg = "Completa un nuevo reto de verificación.";
          outcome = "CAPTCHA inválido";
        }
      }
      if (status === 200) {
        let ok = false;
        try {
          ok = await argon2.verify(
            u?.password_hash || dummyHash,
            String(req.body.password || "").slice(0, 128),
          );
        } catch {
          /* invalid stored hash is also rejected */
        }
        if (!ok || u?.estado_cuenta !== "Activa" || u.cambio_obligatorio) {
          status = 401;
          msg = "Correo o contraseña incorrectos, o cuenta no habilitada.";
          outcome = "Fallido";
        }
      }
      await q(
        c,
        `INSERT INTO intento_acceso(usuario_id,reto_captcha_id,cuenta_hmac,origen_hmac,resultado,ocurrido_en) VALUES(?,?,?,?,?,${nowSQL})`,
        [u?.id || null, rid, account, source, outcome],
      );
      if (status !== 200) return { status, msg, captcha: fail.n >= 2 };
      const raw = token();
      await q(
        c,
        `INSERT INTO sesion(usuario_id,token_hash,creada_en,ultima_actividad_en) VALUES(?,?,${nowSQL},${nowSQL})`,
        [u.id, sha(raw)],
      );
      return { raw, usuario: publicProfile(u) };
    },
    "auth:" + source.toString("hex").slice(0, 32),
  );
  if (result.status)
    return res
      .status(result.status)
      .json({ message: result.msg, captcha: result.captcha });
  res.cookie("itt_session", result.raw, cookieOpts);
  res.json({
    usuario: result.usuario,
    csrf: crypto
      .createHmac("sha256", process.env.APP_SECRET)
      .update(result.raw)
      .digest("hex"),
  });
});
api.post("/credenciales/canjear", async (req, res) => {
  password(req.body.password);
  check(
    req.body.password === req.body.confirmacion,
    "Las contraseñas no coinciden.",
  );
  const result = await tx(
    async (c) => {
      const cap = await consumeCaptcha(c, req, "Cambio inicial");
      if (!cap.ok) return { error: "Verificación inválida o vencida." };
      const [r] = await q(
        c,
        `SELECT t.*,u.estado_cuenta FROM credencial_temporal t JOIN usuario u ON u.id=t.usuario_id WHERE t.token_hash=? FOR UPDATE`,
        [sha(String(req.body.token || ""))],
      );
      if (
        !r ||
        r.usada_en ||
        r.revocada_en ||
        Date.parse(r.vence_en + "Z") < Date.now() ||
        r.estado_cuenta === "Inactiva"
      )
        return {
          error:
            "La credencial no está vigente. Solicita otra a administración.",
        };
      await q(
        c,
        `UPDATE credencial_temporal SET usada_en=${nowSQL} WHERE id=?`,
        [r.id],
      );
      await q(
        c,
        `UPDATE usuario SET password_hash=?,cambio_obligatorio=0,estado_cuenta='Activa',actualizada_en=${nowSQL},version=version+1 WHERE id=?`,
        [
          await argon2.hash(req.body.password, { type: argon2.argon2id }),
          r.usuario_id,
        ],
      );
      await revoke(c, r.usuario_id);
      return { ok: true };
    },
    "credential:" +
      sha(String(req.body.token || ""))
        .toString("hex")
        .slice(0, 30),
  );
  check(!result.error, result.error);
  res.json(result);
});
api.get("/sesion", auth, (req, res) =>
  res.json({
    usuario: publicProfile(req.user),
    csrf: crypto
      .createHmac("sha256", process.env.APP_SECRET)
      .update(req.cookies.itt_session)
      .digest("hex"),
  }),
);
api.post("/sesion/cerrar", auth, async (req, res) => {
  await q(pool, `UPDATE sesion SET revocada_en=${nowSQL} WHERE id=?`, [
    req.user.session_id,
  ]);
  res.clearCookie("itt_session", cookieOpts);
  res.json({ ok: true });
});
api.get("/salud", async (req, res) => {
  await q(pool, "SELECT 1");
  res.json({ ok: true });
});
api.get("/qr/:token", async (req, res) => {
  check(/^[a-f0-9]{64}$/.test(req.params.token), "Código QR inválido.", 404);
  const [r] = await q(
    pool,
    "SELECT e.id,e.clave,e.nombre,b.nombre edificio FROM codigo_qr qr JOIN espacio e ON e.id=qr.espacio_id JOIN edificio b ON b.id=e.edificio_id WHERE qr.token=? AND qr.revocado_en IS NULL AND e.activo=1 AND b.activo=1",
    [req.params.token],
  );
  check(r, "El QR está revocado o el espacio no está disponible.", 404);
  res.json(r);
});
api.use(auth);
api.get("/catalogos", async (req, res) => {
  const all = req.user.rol_id === 3 && req.query.todos === "1";
  const out = {};
  for (const table of ["edificio", "espacio", "tipo_falla", "periodo_escolar"])
    out[table] = await q(
      pool,
      `SELECT * FROM ${table}${all ? "" : " WHERE activo=1"} ORDER BY id`,
    );
  res.json(out);
});
api.get("/tecnicos", async (req, res) => {
  check(req.user.rol_id === 3, "Acceso administrativo.", 403);
  res.json(
    await q(
      pool,
      "SELECT id,nombre FROM usuario WHERE rol_id=2 AND estado_cuenta='Activa' AND cambio_obligatorio=0",
    ),
  );
});
api.get("/usuarios", admin, async (req, res) =>
  res.json(
    (
      await q(
        pool,
        "SELECT u.*,r.nombre rol FROM usuario u JOIN rol r ON r.id=u.rol_id ORDER BY id",
      )
    ).map(publicProfile),
  ),
);
api.post("/usuarios", admin, async (req, res) => {
  const d = validateUser(req.body),
    reason = text(req.body.motivo, 3, 1000, "Motivo");
  const out = await tx(async (c) => {
    const r = await q(
      c,
      `INSERT INTO usuario(rol_id,nombre,correo,tipo_persona,identificador,creada_en,actualizada_en) VALUES(?,?,?,?,?,${nowSQL},${nowSQL})`,
      [d.rol_id, d.nombre, d.correo, d.tipo_persona, d.identificador],
    );
    const t = await issueCredential(c, req.user, r.insertId, "Alta");
    await audit(c, req.user, "usuario", r.insertId, "Alta", reason, null, d);
    return { id: r.insertId, credencial: t };
  }, "usuarios");
  res.status(201).json(out);
});
api.patch("/usuarios/:id", admin, async (req, res) => {
  const uid = id(req.params.id),
    reason = text(req.body.motivo, 3, 1000, "Motivo"),
    d = req.body;
  const out = await tx(async (c) => {
    const [u] = await q(c, "SELECT * FROM usuario WHERE id=? FOR UPDATE", [
      uid,
    ]);
    check(u, "Cuenta no encontrada.", 404);
    check(Number(d.version) === u.version, "La cuenta cambió. Recarga.", 409);
    const role = Number(d.rol_id ?? u.rol_id),
      state = d.estado_cuenta || u.estado_cuenta;
    check(
      [1, 2, 3].includes(role) &&
        ["Activa", "Inactiva", "Pendiente"].includes(state),
      "Rol o estado inválido.",
    );
    if (u.rol_id === 3 && (role !== 3 || state !== "Activa")) {
      const [n] = await q(
        c,
        "SELECT COUNT(*) n FROM usuario WHERE rol_id=3 AND estado_cuenta='Activa'",
      );
      check(n.n > 1, "Debe permanecer al menos un administrador activo.", 409);
    }
    if (u.rol_id === 2 && (role !== 2 || state !== "Activa")) {
      const [n] = await q(
        c,
        "SELECT COUNT(*) n FROM asignacion WHERE tecnico_id=? AND fin_en IS NULL",
        [uid],
      );
      check(
        n.n === 0,
        "Reasigna las tareas del técnico antes de cambiar su cuenta.",
        409,
      );
    }
    check(
      !(state === "Activa" && !u.password_hash),
      "La cuenta necesita definir su contraseña primero.",
    );
    await q(
      c,
      `UPDATE usuario SET rol_id=?,estado_cuenta=?,version=version+1,actualizada_en=${nowSQL} WHERE id=?`,
      [role, state, uid],
    );
    await revoke(c, uid);
    await audit(
      c,
      req.user,
      "usuario",
      uid,
      "Cambio",
      reason,
      { rol_id: u.rol_id, estado_cuenta: u.estado_cuenta },
      { rol_id: role, estado_cuenta: state },
    );
    return { ok: true };
  }, "usuarios");
  res.json(out);
});
api.post("/usuarios/:id/credencial", admin, async (req, res) => {
  res.json(
    await tx(async (c) => {
      const [u] = await q(c, "SELECT * FROM usuario WHERE id=? FOR UPDATE", [
        id(req.params.id),
      ]);
      check(
        u && u.estado_cuenta !== "Inactiva",
        "Reactiva la cuenta antes de emitir una credencial.",
      );
      const t = await issueCredential(c, req.user, u.id, "Recuperación");
      await audit(
        c,
        req.user,
        "usuario",
        u.id,
        "Recuperación",
        req.body.motivo,
      );
      return { credencial: t };
    }, "usuarios"),
  );
});
// Catalog writes are serialized across create and update paths. Identifiers stay stable.
const catalogFields = {
  edificio: ["clave", "nombre", "activo"],
  espacio: ["edificio_id", "clave", "nombre", "mapa_x", "mapa_y", "activo"],
  tipo_falla: ["clave", "nombre", "activo"],
  periodo_escolar: ["clave", "nombre", "fecha_inicio", "fecha_fin", "activo"],
};
api.post("/catalogos/:tabla", admin, saveCatalog);
api.patch("/catalogos/:tabla/:id", admin, saveCatalog);
async function saveCatalog(req, res) {
  const table = req.params.tabla;
  check(catalogFields[table], "Catálogo inválido.", 404);
  const fields = catalogFields[table],
    d = req.body,
    reason = text(d.motivo, 3, 1000, "Motivo");
  const out = await tx(async (c) => {
    const rid = req.params.id ? id(req.params.id) : null;
    const [old] = rid
      ? await q(c, `SELECT * FROM ${table} WHERE id=? FOR UPDATE`, [rid])
      : [];
    check(!rid || old, "Registro no encontrado.", 404);
    const data = { ...old, ...d };
    data.clave = text(data.clave, 1, 20, "Clave");
    data.nombre = text(data.nombre, 2, 100, "Nombre");
    data.activo = data.activo === false || Number(data.activo) === 0 ? 0 : 1;
    if (table === "periodo_escolar") {
      check(
        /^\d{4}-\d{2}-\d{2}$/.test(data.fecha_inicio) &&
          /^\d{4}-\d{2}-\d{2}$/.test(data.fecha_fin) &&
          data.fecha_inicio <= data.fecha_fin,
        "Fechas de periodo inválidas.",
      );
      const overlap = await q(
        c,
        "SELECT id FROM periodo_escolar WHERE activo=1 AND id<>? AND fecha_inicio<=? AND fecha_fin>=?",
        [rid || 0, data.fecha_fin, data.fecha_inicio],
      );
      check(
        !data.activo || !overlap.length,
        "El periodo se superpone con otro activo.",
        409,
      );
    }
    if (table === "espacio") {
      data.edificio_id = id(data.edificio_id);
      const [b] = await q(c, "SELECT * FROM edificio WHERE id=?", [
        data.edificio_id,
      ]);
      check(b && (!data.activo || b.activo), "Selecciona un edificio activo.");
      if (old && old.edificio_id !== data.edificio_id) {
        const used = await q(
          c,
          "SELECT id FROM incidencia WHERE espacio_id=? LIMIT 1",
          [rid],
        );
        check(
          !used.length,
          "Un espacio con historia no puede cambiar de edificio.",
          409,
        );
      }
      for (const coord of ["mapa_x", "mapa_y"])
        data[coord] =
          data[coord] === "" || data[coord] == null
            ? null
            : Number(data[coord]);
      check(
        (data.mapa_x === null && data.mapa_y === null) ||
          (Number.isFinite(data.mapa_x) &&
            Number.isFinite(data.mapa_y) &&
            data.mapa_x >= 0 &&
            data.mapa_x <= 1 &&
            data.mapa_y >= 0 &&
            data.mapa_y <= 1),
        "Define ambas coordenadas entre 0 y 1, o ninguna.",
      );
    }
    if (table === "edificio" && !data.activo && rid) {
      check(
        !(
          await q(
            c,
            "SELECT id FROM espacio WHERE edificio_id=? AND activo=1 LIMIT 1",
            [rid],
          )
        ).length,
        "Desactiva primero los espacios del edificio.",
        409,
      );
    }
    const values = fields.map((f) => data[f]);
    let r;
    if (rid)
      r = await q(
        c,
        `UPDATE ${table} SET ${fields.map((f) => f + "=?").join(",")} WHERE id=?`,
        [...values, rid],
      );
    else
      r = await q(
        c,
        `INSERT INTO ${table}(${fields.join(",")}) VALUES(${fields.map(() => "?").join(",")})`,
        values,
      );
    await audit(
      c,
      req.user,
      table,
      rid || r.insertId,
      rid ? "Cambio" : "Alta",
      reason,
      old || null,
      Object.fromEntries(fields.map((f) => [f, data[f]])),
    );
    return { id: rid || r.insertId };
  }, "catalogos");
  res.status(req.params.id ? 200 : 201).json(out);
}
api.get("/espacios", async (req, res) =>
  res.json(
    await q(
      pool,
      "SELECT e.*,b.nombre edificio FROM espacio e JOIN edificio b ON b.id=e.edificio_id WHERE e.activo=1 AND b.activo=1 ORDER BY b.clave,e.clave",
    ),
  ),
);
api.post("/espacios/:id/qr", admin, async (req, res) => {
  const out = await tx(async (c) => {
    const [e] = await q(
      c,
      "SELECT * FROM espacio WHERE id=? AND activo=1 FOR UPDATE",
      [id(req.params.id)],
    );
    check(e, "Espacio no disponible.", 404);
    const [prev] = await q(
      c,
      "SELECT * FROM codigo_qr WHERE espacio_id=? AND revocado_en IS NULL FOR UPDATE",
      [e.id],
    );
    if (prev && !req.body.renovar) return prev;
    const [max] = await q(
      c,
      "SELECT COALESCE(MAX(version),0) n FROM codigo_qr WHERE espacio_id=?",
      [e.id],
    );
    await q(
      c,
      `UPDATE codigo_qr SET revocado_en=${nowSQL} WHERE espacio_id=? AND revocado_en IS NULL`,
      [e.id],
    );
    const t = token();
    await q(
      c,
      `INSERT INTO codigo_qr(espacio_id,version,token,emitido_por,emitido_en) VALUES(?,?,?,?,${nowSQL})`,
      [e.id, max.n + 1, t, req.user.id],
    );
    await audit(
      c,
      req.user,
      "codigo_qr",
      e.id,
      "Emisión",
      req.body.motivo || "Emisión de etiqueta QR",
    );
    return { token: t, version: max.n + 1 };
  }, "qr:" + req.params.id);
  const url = origin + "/?qr=" + out.token;
  res.json({
    url,
    version: out.version,
    imagen: await QRCode.toDataURL(url, { width: 480, margin: 2 }),
  });
});
// Only the three minimal fields below are exposed for other people's possible duplicates.
async function duplicates(c, space, type) {
  return q(
    c,
    "SELECT folio,estado,creada_en FROM incidencia WHERE espacio_id=? AND tipo_falla_id=? AND estado IN ('Pendiente','En proceso','En revisión') ORDER BY creada_en DESC LIMIT 10",
    [id(space), id(type)],
  );
}
api.get("/incidencias/coincidencias", async (req, res) =>
  res.json(
    await duplicates(pool, req.query.espacio_id, req.query.tipo_falla_id),
  ),
);
const listSelect = `SELECT i.*,e.clave espacio_clave,e.nombre espacio,b.nombre edificio,b.clave edificio_clave,t.nombre tipo,p.nombre periodo,u.nombre reportante,a.tecnico_id,tec.nombre tecnico FROM incidencia i JOIN espacio e ON e.id=i.espacio_id JOIN edificio b ON b.id=e.edificio_id JOIN tipo_falla t ON t.id=i.tipo_falla_id JOIN periodo_escolar p ON p.id=i.periodo_id JOIN usuario u ON u.id=i.reportante_id LEFT JOIN asignacion a ON a.incidencia_id=i.id AND a.fin_en IS NULL LEFT JOIN usuario tec ON tec.id=a.tecnico_id`;
function listWhere(u, params) {
  for (const k of ["desde", "hasta"])
    if (params[k])
      check(
        /^\d{4}-\d{2}-\d{2}$/.test(params[k]) &&
          !Number.isNaN(Date.parse(params[k])),
        "Fecha de filtro inválida.",
      );
  check(
    !params.desde || !params.hasta || params.desde <= params.hasta,
    "La fecha inicial no puede ser posterior a la final.",
  );
  const where = [],
    args = [];
  if (u.rol_id !== 3) {
    where.push("(i.reportante_id=? OR a.tecnico_id=?)");
    args.push(u.id, u.rol_id === 2 ? u.id : 0);
  }
  for (const [param, col] of Object.entries({
    estado: "i.estado",
    tipo_falla_id: "i.tipo_falla_id",
    espacio_id: "i.espacio_id",
    edificio_id: "e.edificio_id",
    periodo_id: "i.periodo_id",
    tecnico_id: "a.tecnico_id",
  })) {
    if (params[param]) {
      where.push(col + "=?");
      args.push(params[param]);
    }
  }
  if (params.q) {
    where.push("(i.folio LIKE ? OR i.descripcion LIKE ?)");
    const s = "%" + String(params.q).slice(0, 200) + "%";
    args.push(s, s);
  }
  if (params.desde) {
    where.push(
      "i.creada_en>=CONVERT_TZ(CONCAT(?,' 00:00:00'),'-06:00','+00:00')",
    );
    args.push(params.desde);
  }
  if (params.hasta) {
    where.push(
      "i.creada_en<DATE_ADD(CONVERT_TZ(CONCAT(?,' 00:00:00'),'-06:00','+00:00'),INTERVAL 1 DAY)",
    );
    args.push(params.hasta);
  }
  return { sql: where.length ? " WHERE " + where.join(" AND ") : "", args };
}
api.get("/incidencias", async (req, res) => {
  const w = listWhere(req.user, req.query),
    page = Math.max(1, Math.min(100000, Number(req.query.pagina) || 1)),
    limit = 20;
  const rows = await q(
    pool,
    listSelect +
      w.sql +
      " ORDER BY i.creada_en DESC,i.id DESC LIMIT 20 OFFSET " +
      (page - 1) * limit,
    w.args,
  );
  const [total] = await q(
    pool,
    "SELECT COUNT(*) n FROM incidencia i JOIN espacio e ON e.id=i.espacio_id LEFT JOIN asignacion a ON a.incidencia_id=i.id AND a.fin_en IS NULL" +
      w.sql,
    w.args,
  );
  res.json({
    items: rows,
    total: total.n,
    pagina: page,
    paginas: Math.max(1, Math.ceil(total.n / limit)),
  });
});
async function prepPhotos(photos) {
  check(
    Array.isArray(photos) && photos.length <= 5,
    "Se permiten hasta cinco fotografías.",
  );
  const out = [];
  try {
    for (const photo of photos) {
      check(
        typeof photo.data === "string" && photo.data.length <= 6666668,
        "Fotografía demasiado grande.",
      );
      const bytes = Buffer.from(photo.data, "base64");
      check(
        bytes.length > 0 && bytes.length <= 5000000,
        "Cada fotografía debe pesar hasta 5 MB.",
      );
      const meta = await sharp(bytes, {
        limitInputPixels: 40000000,
      }).metadata();
      check(
        ["jpeg", "png"].includes(meta.format),
        "Solo se permiten imágenes JPEG o PNG reales.",
      );
      await sharp(bytes, { limitInputPixels: 40000000 }).stats();
      const key = token() + "." + (meta.format === "jpeg" ? "jpg" : "png");
      await fs.writeFile(path.join(files, key), bytes, {
        flag: "wx",
        mode: 0o600,
      });
      out.push({
        key,
        mime: "image/" + meta.format,
        size: bytes.length,
        hash: sha(bytes),
      });
    }
    return out;
  } catch (e) {
    await Promise.all(
      out.map((p) => fs.unlink(path.join(files, p.key)).catch(() => {})),
    );
    throw e.status
      ? e
      : new HttpError(
          422,
          "No se pudo validar la imagen. Utiliza JPEG o PNG sin daños.",
        );
  }
}
async function linkPhotos(c, photos, i, uid, inter = null) {
  for (const p of photos)
    await q(
      c,
      `INSERT INTO evidencia(incidencia_id,intervencion_id,autor_id,clave_archivo,mime,tamano_bytes,sha256,creada_en) VALUES(?,?,?,?,?,?,?,${nowSQL})`,
      [i, inter, uid, p.key, p.mime, p.size, p.hash],
    );
}
async function cleanPhotos(photos) {
  await Promise.all(
    photos.map((p) => fs.unlink(path.join(files, p.key)).catch(() => {})),
  );
}
api.post("/incidencias", async (req, res) => {
  const d = req.body;
  d.descripcion = text(d.descripcion, 20, 2000, "Descripción");
  id(d.espacio_id);
  id(d.tipo_falla_id);
  check(
    /^[a-f0-9-]{36}$/i.test(req.get("Idempotency-Key") || ""),
    "Falta una clave de operación válida.",
  );
  const key = req.get("Idempotency-Key"),
    hash = sha(canonical(d));
  let photos = [];
  try {
    const out = await tx(
      async (c) => {
        const [prev] = await q(
          c,
          "SELECT * FROM solicitud_idempotente WHERE usuario_id=? AND operacion='alta_incidencia' AND clave=?",
          [req.user.id, key],
        );
        if (prev) {
          check(
            prev.payload_hash.equals(hash),
            "Esta clave ya se usó con otros datos.",
            409,
          );
          return { id: prev.incidencia_id, reintento: true };
        }
        const [space] = await q(
          c,
          "SELECT e.id FROM espacio e JOIN edificio b ON b.id=e.edificio_id WHERE e.id=? AND e.activo=1 AND b.activo=1 FOR SHARE",
          [d.espacio_id],
        );
        const [type] = await q(
          c,
          "SELECT id FROM tipo_falla WHERE id=? AND activo=1 FOR SHARE",
          [d.tipo_falla_id],
        );
        check(space && type, "Selecciona un espacio y tipo de falla activos.");
        const [period] = await q(
          c,
          "SELECT id FROM periodo_escolar WHERE activo=1 AND DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','-06:00')) BETWEEN fecha_inicio AND fecha_fin FOR SHARE",
        );
        check(
          period,
          "No hay periodo escolar vigente. Contacta a administración.",
          409,
        );
        const dup = await duplicates(c, d.espacio_id, d.tipo_falla_id);
        if (dup.length)
          check(
            typeof d.diferencia_duplicado === "string" &&
              d.diferencia_duplicado.trim().length >= 10,
            "Revisa las coincidencias y explica qué hace diferente este reporte.",
            409,
            { coincidencias: dup },
          );
        if (d.diferencia_duplicado)
          text(d.diferencia_duplicado, 10, 1000, "Diferencia");
        photos = await prepPhotos(d.fotos || []);
        const folio =
          "ITT-" + crypto.randomBytes(10).toString("hex").toUpperCase();
        const r = await q(
          c,
          `INSERT INTO incidencia(folio,reportante_id,espacio_id,tipo_falla_id,periodo_id,descripcion,diferencia_duplicado,creada_en) VALUES(?,?,?,?,?,?,?,${nowSQL})`,
          [
            folio,
            req.user.id,
            d.espacio_id,
            d.tipo_falla_id,
            period.id,
            d.descripcion,
            d.diferencia_duplicado?.trim() || null,
          ],
        );
        await linkPhotos(c, photos, r.insertId, req.user.id);
        await q(
          c,
          `INSERT INTO solicitud_idempotente(usuario_id,operacion,clave,payload_hash,incidencia_id,creada_en) VALUES(?,'alta_incidencia',?,?,?,${nowSQL})`,
          [req.user.id, key, hash, r.insertId],
        );
        await event(
          c,
          req.user,
          { id: r.insertId, reportante_id: req.user.id, estado: "Pendiente" },
          "Registro",
          null,
          "Incidencia registrada.",
        );
        return { id: r.insertId, folio };
      },
      "alta:" + req.user.id + ":" + key,
    );
    res.status(out.reintento ? 200 : 201).json(out);
  } catch (e) {
    await cleanPhotos(photos);
    throw e;
  }
});
api.get("/incidencias/:id", async (req, res) => {
  const i = await incident(pool, req.user, req.params.id),
    [detail] = await q(pool, listSelect + " WHERE i.id=?", [i.id]),
    internal = await staff(pool, req.user, i);
  const visible = internal ? "" : " AND visibilidad='Pública'";
  const rows = await q(
    pool,
    "SELECT v.*,u.nombre autor FROM intervencion v JOIN usuario u ON u.id=v.autor_id WHERE incidencia_id=?" +
      visible +
      " ORDER BY v.creada_en,v.id",
    [i.id],
  );
  const history = await q(
    pool,
    "SELECT v.*,u.nombre autor FROM evento_incidencia v JOIN usuario u ON u.id=v.autor_id WHERE incidencia_id=?" +
      visible +
      " ORDER BY v.creado_en,v.id",
    [i.id],
  );
  const photos = await q(
    pool,
    "SELECT e.id,e.mime,e.intervencion_id FROM evidencia e LEFT JOIN intervencion v ON v.id=e.intervencion_id WHERE e.incidencia_id=?" +
      (internal ? "" : " AND (v.id IS NULL OR v.visibilidad='Pública')"),
    [i.id],
  );
  const assignments = await q(
    pool,
    "SELECT a.id,a.inicio_en,a.fin_en,a.motivo,u.nombre tecnico FROM asignacion a JOIN usuario u ON u.id=a.tecnico_id WHERE incidencia_id=? ORDER BY a.id",
    [i.id],
  );
  res.json({
    ...detail,
    intervenciones: rows,
    historial: history,
    evidencias: photos,
    asignaciones: assignments,
  });
});
api.post("/incidencias/:id/asignaciones", admin, async (req, res) => {
  res.json(
    await tx(async (c) => {
      const i = await incident(c, req.user, req.params.id, true);
      version(i, req.body);
      check(
        ["Pendiente", "En proceso"].includes(i.estado),
        "Asigna o reasigna durante Pendiente o En proceso.",
        409,
      );
      const [t] = await q(
        c,
        "SELECT id FROM usuario WHERE id=? AND rol_id=2 AND estado_cuenta='Activa' AND cambio_obligatorio=0 FOR SHARE",
        [id(req.body.tecnico_id)],
      );
      check(t, "Selecciona un técnico activo.");
      const reason = text(req.body.motivo, 3, 1000, "Motivo");
      await q(
        c,
        `UPDATE asignacion SET fin_en=${nowSQL} WHERE incidencia_id=? AND fin_en IS NULL`,
        [i.id],
      );
      await q(
        c,
        `INSERT INTO asignacion(incidencia_id,tecnico_id,asignada_por,inicio_en,motivo) VALUES(?,?,?,${nowSQL},?)`,
        [i.id, t.id, req.user.id, reason],
      );
      const old = i.estado;
      i.estado = "En proceso";
      await q(
        c,
        "UPDATE incidencia SET estado='En proceso',version=version+1 WHERE id=?",
        [i.id],
      );
      await event(c, req.user, i, "Asignación", old, reason);
      return { ok: true };
    }),
  );
});
api.post("/incidencias/:id/intervenciones", async (req, res) => {
  let photos = [];
  try {
    const out = await tx(async (c) => {
      const i = await incident(c, req.user, req.params.id, true),
        d = req.body;
      version(i, d);
      check(
        await staff(c, req.user, i),
        "Solo el técnico asignado o administración pueden intervenir.",
        403,
      );
      check(
        i.estado === "En proceso",
        "Registra la intervención durante En proceso.",
        409,
      );
      check(
        ["Diagnóstico", "Avance", "Solución", "Comentario"].includes(d.tipo) &&
          ["Pública", "Interna"].includes(d.visibilidad),
        "Tipo o visibilidad inválidos.",
      );
      if (req.user.rol_id === 3)
        text(d.motivo, 3, 1000, "Motivo de intervención administrativa");
      const content = text(d.texto, 1, 2000, "Detalle");
      if (d.tipo === "Solución") {
        const diagnoses = await q(
          c,
          "SELECT id FROM intervencion WHERE incidencia_id=? AND tipo='Diagnóstico' LIMIT 1",
          [i.id],
        );
        check(
          diagnoses.length,
          "Registra el diagnóstico antes de enviar la solución.",
          409,
        );
      }
      photos = await prepPhotos(d.fotos || []);
      const r = await q(
        c,
        `INSERT INTO intervencion(incidencia_id,autor_id,tipo,texto,visibilidad,creada_en) VALUES(?,?,?,?,?,${nowSQL})`,
        [i.id, req.user.id, d.tipo, content, d.visibilidad],
      );
      await linkPhotos(c, photos, i.id, req.user.id, r.insertId);
      const old = i.estado;
      if (d.tipo === "Solución") {
        transition(i.estado, "En revisión");
        i.estado = "En revisión";
      }
      await q(
        c,
        "UPDATE incidencia SET estado=?,version=version+1 WHERE id=?",
        [i.estado, i.id],
      );
      await event(c, req.user, i, d.tipo, old, content, d.visibilidad);
      return { ok: true };
    }, "intervencion:" + req.params.id);
    res.status(201).json(out);
  } catch (e) {
    await cleanPhotos(photos);
    throw e;
  }
});
api.post("/incidencias/:id/acciones", async (req, res) => {
  const d = req.body;
  res.json(
    await tx(async (c) => {
      const i = await incident(c, req.user, req.params.id, true);
      version(i, d);
      const old = i.estado,
        reason = text(d.motivo, 3, 1000, "Motivo"),
        isAdmin = req.user.rol_id === 3;
      if (d.accion === "priorizar") {
        check(isAdmin, "Solo administración puede clasificar.", 403);
        check(
          !["Cerrado", "Cancelado"].includes(i.estado),
          "El reporte está finalizado.",
          409,
        );
        check(
          ["Alta", "Media", "Baja"].includes(d.prioridad),
          "Prioridad inválida.",
        );
        const space = id(d.espacio_id || i.espacio_id),
          type = id(d.tipo_falla_id || i.tipo_falla_id);
        check(
          (
            await q(
              c,
              "SELECT e.id FROM espacio e JOIN edificio b ON b.id=e.edificio_id WHERE e.id=? AND e.activo=1 AND b.activo=1",
              [space],
            )
          ).length,
          "Espacio inactivo.",
        );
        check(
          (
            await q(c, "SELECT id FROM tipo_falla WHERE id=? AND activo=1", [
              type,
            ])
          ).length,
          "Tipo inactivo.",
        );
        await q(
          c,
          "UPDATE incidencia SET prioridad=?,espacio_id=?,tipo_falla_id=?,version=version+1 WHERE id=?",
          [d.prioridad, space, type, i.id],
        );
        await event(c, req.user, i, "Clasificación", old, reason, "Pública", {
          antes: {
            prioridad: i.prioridad,
            espacio_id: i.espacio_id,
            tipo_falla_id: i.tipo_falla_id,
          },
          despues: {
            prioridad: d.prioridad,
            espacio_id: space,
            tipo_falla_id: type,
          },
        });
        return { ok: true };
      }
      let target;
      if (d.accion === "aprobar") {
        check(isAdmin, "Se requiere revisión administrativa.", 403);
        const [sol] = await q(
          c,
          "SELECT autor_id FROM intervencion WHERE incidencia_id=? AND tipo='Solución' ORDER BY id DESC LIMIT 1",
          [i.id],
        );
        check(
          sol && sol.autor_id !== req.user.id,
          "La solución debe aprobarla una persona distinta de su autor.",
          403,
        );
        target = "Resuelto";
      } else if (d.accion === "devolver") {
        check(
          isAdmin && i.estado === "En revisión",
          "Solo administración devuelve una revisión.",
          403,
        );
        target = "En proceso";
      } else if (d.accion === "cerrar") {
        check(
          isAdmin || i.reportante_id === req.user.id,
          "Solo el reportante o administración verifican el cierre.",
          403,
        );
        target = "Cerrado";
      } else if (d.accion === "inconformidad") {
        check(
          isAdmin || i.reportante_id === req.user.id,
          "Solo el reportante o administración reabren.",
          403,
        );
        check(
          i.estado === "Resuelto",
          "Solo se puede reabrir una incidencia resuelta.",
          409,
        );
        target = "En proceso";
      } else if (d.accion === "cancelar" || d.accion === "duplicado") {
        check(isAdmin, "Solo administración puede cancelar.", 403);
        check(
          ["Pendiente", "En proceso"].includes(i.estado),
          "Solo se cancelan incidencias Pendientes o En proceso.",
          409,
        );
        target = "Cancelado";
        if (d.accion === "duplicado") {
          const [match] = d.principal_folio
            ? await q(c, "SELECT id FROM incidencia WHERE folio=?", [
                text(d.principal_folio, 3, 30, "Folio principal"),
              ])
            : [];
          check(
            !d.principal_folio || match,
            "Folio principal no encontrado.",
            404,
          );
          const principal = id(match?.id || d.principal_id);
          check(
            principal !== i.id,
            "Un reporte no puede ser su propio principal.",
          );
          let current = principal,
            seen = new Set([i.id]);
          while (current) {
            check(!seen.has(current), "El vínculo generaría un ciclo.", 409);
            seen.add(current);
            const [p] = await q(
              c,
              "SELECT id,principal_id FROM incidencia WHERE id=? FOR UPDATE",
              [current],
            );
            check(p, "Folio principal no encontrado.", 404);
            current = p.principal_id;
          }
          await q(c, "UPDATE incidencia SET principal_id=? WHERE id=?", [
            principal,
            i.id,
          ]);
        }
      } else throw new HttpError(422, "Acción desconocida.");
      transition(old, target);
      i.estado = target;
      await q(
        c,
        `UPDATE incidencia SET estado=?,version=version+1,resuelta_en=${target === "Resuelto" ? nowSQL : target === "En proceso" ? "NULL" : "resuelta_en"},cerrada_en=${target === "Cerrado" ? nowSQL : "cerrada_en"} WHERE id=?`,
        [target, i.id],
      );
      if (["Cerrado", "Cancelado"].includes(target))
        await q(
          c,
          `UPDATE asignacion SET fin_en=${nowSQL} WHERE incidencia_id=? AND fin_en IS NULL`,
          [i.id],
        );
      await event(c, req.user, i, d.accion, old, reason);
      return { ok: true };
    }, "acciones"),
  );
});
api.get("/evidencias/:id", async (req, res) => {
  const [e] = await q(
    pool,
    "SELECT e.*,v.visibilidad FROM evidencia e LEFT JOIN intervencion v ON v.id=e.intervencion_id WHERE e.id=?",
    [id(req.params.id)],
  );
  check(e, "Archivo no disponible.", 404);
  const i = await incident(pool, req.user, e.incidencia_id);
  check(
    e.visibilidad !== "Interna" || (await staff(pool, req.user, i)),
    "Archivo no disponible.",
    404,
  );
  res
    .type(e.mime)
    .set("Content-Disposition", "inline")
    .sendFile(path.join(files, e.clave_archivo));
});
api.get("/notificaciones", async (req, res) => {
  const rows = await q(
    pool,
    "SELECT n.id,n.leida_en,v.incidencia_id,v.tipo,v.creado_en,v.visibilidad,i.folio FROM notificacion n JOIN evento_incidencia v ON v.id=n.evento_id JOIN incidencia i ON i.id=v.incidencia_id WHERE n.destinatario_id=? ORDER BY n.id DESC LIMIT 200",
    [req.user.id],
  );
  const visible = [];
  for (const row of rows) {
    const [i] = await q(pool, "SELECT * FROM incidencia WHERE id=?", [
      row.incidencia_id,
    ]);
    if (
      (await canSee(pool, req.user, i)) &&
      (row.visibilidad === "Pública" || (await staff(pool, req.user, i)))
    )
      visible.push(row);
  }
  res.json(visible);
});
api.post("/notificaciones/:id/leer", async (req, res) => {
  const r = await q(
    pool,
    `UPDATE notificacion SET leida_en=COALESCE(leida_en,${nowSQL}) WHERE id=? AND destinatario_id=?`,
    [id(req.params.id), req.user.id],
  );
  check(r.affectedRows, "Aviso no disponible.", 404);
  res.json({ ok: true });
});
api.get(["/reportes", "/reportes.csv"], admin, async (req, res) => {
  const w = listWhere(req.user, req.query),
    rows = await q(
      pool,
      listSelect + w.sql + " ORDER BY i.creada_en DESC,i.id DESC",
      w.args,
    );
  const columns = [
    "folio",
    "estado",
    "tipo",
    "edificio",
    "espacio",
    "periodo",
    "prioridad",
    "tecnico",
    "creada_en",
    "resuelta_en",
  ];
  const labels = {
    folio: "Folio",
    estado: "Estado",
    tipo: "Tipo de falla",
    edificio: "Edificio",
    espacio: "Espacio",
    periodo: "Periodo",
    prioridad: "Prioridad",
    tecnico: "Técnico",
    creada_en: "Fecha del reporte",
    resuelta_en: "Fecha de resolución",
  };
  if (req.path.endsWith(".csv")) {
    const line = (r) =>
      columns
        .map((c) =>
          csvCell(
            c.endsWith("_en") && r[c]
              ? new Date(r[c] + "Z").toLocaleString("sv-SE", {
                  timeZone: "America/Mexico_City",
                }) + " America/Mexico_City"
              : r[c],
          ),
        )
        .join(",");
    res
      .type("text/csv")
      .attachment("incidencias-itt.csv")
      .send(
        "\uFEFF" +
          columns.map((c) => csvCell(labels[c])).join(",") +
          "\r\n" +
          rows.map(line).join("\r\n"),
      );
    return;
  }
  const group = (field) =>
    Object.entries(
      rows.reduce((a, r) => {
        const k =
          (field === "espacio"
            ? r.edificio_clave + " · " + r.espacio_clave
            : r[field]) || "Sin asignar";
        a[k] = (a[k] || 0) + 1;
        return a;
      }, {}),
    ).map(([nombre, total]) => ({ nombre, total }));
  res.json({
    total: rows.length,
    tiempoMedioHoras: meanHours(rows),
    porEstado: group("estado"),
    porTipo: group("tipo"),
    porEspacio: group("espacio"),
    porTecnico: group("tecnico"),
    items: rows,
    columns,
    labels,
  });
});
api.get("/auditoria", admin, async (req, res) =>
  res.json(
    await q(
      pool,
      "SELECT a.*,u.nombre autor FROM auditoria_admin a JOIN usuario u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200",
    ),
  ),
);
api.use((req, res) =>
  res.status(404).json({ message: "Operación no disponible." }),
);
app.use(express.static(path.resolve("dist")));
app.get("/{*path}", (req, res) =>
  res.sendFile(path.resolve("dist/index.html")),
);
app.use((e, req, res, next) => {
  void next;
  if (e.code === "ER_DUP_ENTRY")
    return res.status(409).json({
      message: "La clave, correo o identificador ya está registrado.",
    });
  if (e.code === "ER_LOCK_DEADLOCK" || e.code === "ER_LOCK_WAIT_TIMEOUT")
    return res.status(409).json({
      message: "Otra operación está en curso. Recarga e intenta nuevamente.",
    });
  const status = e.status || 500;
  if (status >= 500)
    console.error(
      JSON.stringify({
        time: new Date().toISOString(),
        code: e.code || "INTERNAL",
        method: req.method,
        path: req.route?.path || "unknown",
      }),
    );
  res.status(status).json({
    message:
      status >= 500
        ? "No se pudo completar la operación. Intenta nuevamente."
        : e.message,
    ...(e.extra || {}),
  });
});
