import fs from "node:fs/promises";
import path from "node:path";
import { pool, query as q } from "../server/db.js";
// Run with the API stopped to avoid racing an upload before its commit.
if (process.env.API_STOPPED !== "true")
  throw new Error("Detén la API y confirma API_STOPPED=true.");
try {
  const root = path.resolve(process.env.PRIVATE_FILES || "var/evidencias"),
    known = new Set(
      (await q(pool, "SELECT clave_archivo FROM evidencia")).map(
        (r) => r.clave_archivo,
      ),
    );
  for (const name of await fs.readdir(root)) {
    if (!/^[a-f0-9]{64}\.(png|jpg)$/.test(name) || known.has(name)) continue;
    const filename = path.join(root, name),
      stat = await fs.stat(filename);
    if (Date.now() - stat.mtimeMs > 86400000) {
      await fs.unlink(filename);
      console.log("Fotografía huérfana retirada.");
    }
  }
} finally {
  await pool.end();
}
