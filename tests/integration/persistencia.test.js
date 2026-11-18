import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createHash } from "node:crypto";
import sharp from "sharp";

async function start() {
  const processHandle = spawn(process.execPath, ["server/index.js"], {
    env: { ...process.env, PORT: "0", BIND_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const port = await new Promise((resolve, reject) => {
    processHandle.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/escuchando en 127\.0\.0\.1:(\d+)/);
      if (match) resolve(match[1]);
    });
    processHandle.once("error", reject);
    processHandle.once("exit", () =>
      reject(new Error("La API terminó antes de escuchar.")),
    );
  });
  return {
    base: "http://127.0.0.1:" + port + "/api",
    async stop() {
      const stopped = once(processHandle, "exit");
      processHandle.kill();
      await stopped;
    },
  };
}
test("Reiniciar el proceso de Express conserva sesión, folio, historial y bytes de la foto en MySQL/bóveda", async () => {
  assert.equal(process.env.DB_NAME, "incidencias_itt_demo");
  assert.equal(process.env.ALLOW_DEMO, "true");
  let app = await start();
  try {
    const headers = {
      "Content-Type": "application/json",
      Origin: process.env.APP_ORIGIN,
    };
    const login = await fetch(app.base + "/acceso", {
      method: "POST",
      headers,
      body: JSON.stringify({
        correo: "docente@toluca.tecnm.mx",
        password: process.env.DEMO_PASSWORD_DOCENTE,
      }),
    });
    assert.equal(login.status, 200);
    headers.Cookie = login.headers.getSetCookie()[0].split(";")[0];
    headers["X-CSRF-Token"] = (await login.json()).csrf;
    const photo = await sharp({
      create: { width: 8, height: 8, channels: 3, background: "#335588" },
    })
      .jpeg()
      .toBuffer();
    const body = {
      espacio_id: 7,
      tipo_falla_id: 6,
      descripcion: "Verificación de persistencia al reiniciar el proceso.",
      diferencia_duplicado: "Ensayo independiente de persistencia.",
      fotos: [{ data: photo.toString("base64") }],
    };
    const created = await fetch(app.base + "/incidencias", {
      method: "POST",
      headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(body),
    });
    assert.equal(created.status, 201);
    const { id, folio } = await created.json();
    await app.stop();
    app = null;
    app = await start();
    const detail = await fetch(app.base + "/incidencias/" + id, { headers });
    assert.equal(detail.status, 200);
    const item = await detail.json();
    assert.equal(item.folio, folio);
    assert.equal(item.historial[0].tipo, "Registro");
    const response = await fetch(
      app.base + "/evidencias/" + item.evidencias[0].id,
      { headers },
    );
    assert.equal(response.status, 200);
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(photo));
  } finally {
    if (app) await app.stop();
  }
});
