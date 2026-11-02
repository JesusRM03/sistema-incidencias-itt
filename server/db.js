import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "itt",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "incidencias_itt",
  socketPath: process.env.DB_SOCKET || undefined,
  charset: "utf8mb4",
  timezone: "Z",
  dateStrings: true,
  connectionLimit: 20,
  multipleStatements: false,
});
export async function query(db, sql, args = []) {
  const [rows] = await db.execute(sql, args);
  return rows;
}
export async function transaction(fn, lock) {
  const c = await pool.getConnection();
  let acquired = false;
  try {
    await c.query("SET time_zone = '+00:00'");
    if (lock) {
      const [r] = await c.execute("SELECT GET_LOCK(?,10) AS ok", [lock]);
      if (!r[0].ok)
        throw Object.assign(
          new Error("Operación ocupada; vuelve a intentar."),
          { status: 409 },
        );
      acquired = true;
    }
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    if (acquired) await c.execute("SELECT RELEASE_LOCK(?)", [lock]);
    c.release();
  }
}
