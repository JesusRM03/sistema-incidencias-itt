import argon2 from "argon2";
import { pool, query as q, transaction as tx } from "../server/db.js";
import { validateUser, password } from "../server/domain.js";
const d = validateUser({
  nombre: process.env.ADMIN_NAME || "Administración ITT",
  correo: process.env.ADMIN_EMAIL,
  identificador: process.env.ADMIN_IDENTIFIER || "ADM001",
  tipo_persona: "Personal",
  rol_id: 3,
});
password(process.env.ADMIN_PASSWORD);
try {
  await tx(async (c) => {
    const [r] = await q(c, "SELECT COUNT(*) n FROM usuario");
    if (r.n)
      throw new Error(
        "La base ya tiene usuarios. El bootstrap solo funciona en una base vacía.",
      );
    await q(
      c,
      "INSERT INTO usuario(rol_id,nombre,correo,tipo_persona,identificador,password_hash,estado_cuenta,cambio_obligatorio,creada_en,actualizada_en) VALUES(3,?,?,'Personal',?,?,'Activa',0,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6))",
      [
        d.nombre,
        d.correo,
        d.identificador,
        await argon2.hash(process.env.ADMIN_PASSWORD, {
          type: argon2.argon2id,
        }),
      ],
    );
  }, "usuarios");
  console.log("Administrador inicial creado.");
} finally {
  await pool.end();
}
