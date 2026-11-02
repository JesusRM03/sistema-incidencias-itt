// Explicit destructive opt-in. Add synthetic rows only to a disposable test database.
import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { pool, query as q } from "../server/db.js";
if (process.env.ALLOW_LOAD !== "true")
  throw new Error("Usa ALLOW_LOAD=true únicamente en una base de prueba.");
const base = process.env.LOAD_URL || "http://localhost:3001",
  origin = process.env.APP_ORIGIN,
  seconds = Number(process.env.LOAD_SECONDS || 600),
  results = [];
// Each worker has its own server session; they do not contend on one session activity row.
const cookies = [];
for (let index = 0; index < 50; index++) {
  const r = await fetch(base + "/api/acceso", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      correo: "admin@toluca.tecnm.mx",
      password: "PruebaITT2026!",
    }),
  });
  if (!r.ok) throw new Error("Carga requiere una cuenta demo autorizada.");
  cookies.push(
    r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
  );
}
try {
  for (const target of [10000, 20000]) {
    const [n] = await q(pool, "SELECT COUNT(*) n FROM incidencia");
    for (let done = n.n; done < target;) {
      const size = Math.min(500, target - done),
        values = [],
        placeholders = [];
      for (let k = 0; k < size; k++) {
        placeholders.push(
          "(?,4,1,1,1,'Registro sintético de rendimiento del laboratorio','Pendiente',UTC_TIMESTAMP())",
        );
        values.push(
          "ITT-CARGA-" + crypto.randomUUID().replaceAll("-", "").slice(0, 18),
        );
      }
      await q(
        pool,
        "INSERT INTO incidencia(folio,reportante_id,espacio_id,tipo_falla_id,periodo_id,descripcion,estado,creada_en) VALUES " +
          placeholders.join(","),
        values,
      );
      done += size;
    }
    const times = [],
      errors = [],
      end = performance.now() + seconds * 1000;
    await Promise.all(
      Array.from({ length: 50 }, async (_, index) => {
        while (performance.now() < end) {
          const start = performance.now();
          try {
            const res = await fetch(
              base +
                "/api/incidencias?" +
                new URLSearchParams({
                  estado: "Pendiente",
                  tipo_falla_id: "1",
                  edificio_id: "1",
                  pagina: String((index % 5) + 1),
                }),
              { headers: { Cookie: cookies[index] } },
            );
            await res.arrayBuffer();
            if (!res.ok) errors.push(res.status);
          } catch (e) {
            errors.push(e.message);
          }
          times.push(performance.now() - start);
          await new Promise((r) => setTimeout(r, 50));
        }
      }),
    );
    times.sort((a, b) => a - b);
    results.push({
      records: target,
      concurrentWorkers: 50,
      durationSeconds: seconds,
      requests: times.length,
      errors: errors.length,
      p95ms: times[Math.ceil(times.length * 0.95) - 1],
      formalCriterion:
        seconds >= 600 &&
        errors.length === 0 &&
        times[Math.ceil(times.length * 0.95) - 1] <=
          (target === 10000 ? 3000 : 5000),
    });
    console.log(results.at(-1));
  }
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile(
    "artifacts/load-results.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await pool.end();
}
