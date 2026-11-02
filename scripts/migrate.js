import fs from "node:fs/promises";
import { pool } from "../server/db.js";
const ddl = await fs.readFile(
  new URL("../server/schema.sql", import.meta.url),
  "utf8",
);
try {
  for (const statement of ddl
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await pool.query(statement);
  console.log("19 tablas creadas o verificadas.");
} finally {
  await pool.end();
}
