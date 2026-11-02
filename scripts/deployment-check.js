import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pool, query as q } from "../server/db.js";
const checks = [];
try {
  const [v] = await q(pool, "SELECT VERSION() version");
  checks.push({
    check: "MySQL 8.4",
    ok: v.version.startsWith("8.4."),
    actual: v.version,
  });
  const [t] = await q(
    pool,
    "SELECT COUNT(DISTINCT TABLE_NAME) tablas,COUNT(*) campos FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE()",
  );
  checks.push({
    check: "19 tablas y 142 campos",
    ok: t.tablas === 19 && t.campos === 142,
    actual: t,
  });
  checks.push({
    check: "Cookies Secure en producción",
    ok:
      process.env.COOKIE_SECURE === "true" &&
      process.env.APP_ORIGIN?.startsWith("https://"),
  });
  checks.push({
    check: "Secreto de servidor configurado",
    ok:
      process.env.APP_SECRET?.length >= 32 &&
      !process.env.APP_SECRET.includes("CAMBIAR"),
  });
  try {
    await promisify(execFile)(process.env.ESPEAK_BINARY || "espeak-ng", [
      "--version",
    ]);
    checks.push({ check: "Alternativa de audio CAPTCHA", ok: true });
  } catch {
    checks.push({ check: "Alternativa de audio CAPTCHA", ok: false });
  }
  const [grants] = await pool.query("SHOW GRANTS FOR CURRENT_USER()");
  const [account] = await q(pool, "SELECT CURRENT_USER() account");
  const statements = grants.flatMap((row) => Object.values(row));
  const broad =
    account.account.startsWith("root@") ||
    statements.some(
      (s) =>
        !/GRANT USAGE ON/i.test(s) &&
        (/ON \*\.\*/.test(s) ||
          (/ALL PRIVILEGES|UPDATE|DELETE|ALTER|DROP/.test(s) &&
            (/ON [^ ]+\.\*/.test(s) ||
              /evento_incidencia|auditoria_admin/.test(s)))),
    );
  checks.push({
    check: "Cuenta de ejecución con bitácoras protegidas",
    ok: !broad,
    actual:
      "Validar grants por tabla según docs/despliegue.md; la cuenta root no es apropiada para producción.",
  });
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile(
    "artifacts/deployment-check.json",
    JSON.stringify(checks, null, 2),
  );
  console.table(checks);
  if (checks.some((c) => !c.ok)) process.exitCode = 1;
} finally {
  await pool.end();
}
