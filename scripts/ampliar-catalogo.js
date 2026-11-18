// Called under the demo seed transaction and its named lock.
import { randomBytes } from "node:crypto";
import { query } from "../server/db.js";

const buildings = [
  ["DC", "Ciencias aplicadas · demo", 0.33, 0.56, ["Aula de cálculo", "Aula de física", "Laboratorio de medición", "Sala de proyectos"]],
  ["DT", "Talleres · demo", 0.68, 0.60, ["Taller de circuitos", "Taller de prototipos", "Aula de dibujo", "Sala de herramientas"]],
  ["DA", "Artes y comunicación · demo", 0.18, 0.60, ["Aula de expresión", "Sala audiovisual", "Taller de fotografía", "Sala de ensayo"]],
];
export async function ampliarCatalogo(c) {
  const done = await query(c, "SELECT id FROM auditoria_admin WHERE entidad='catalogo_demo' AND recurso_id='ampliacion-1' LIMIT 1");
  if (done.length) return;
  const [actor] = await query(c, "SELECT id FROM usuario WHERE rol_id=3 ORDER BY id LIMIT 1");
  for (const [key, name, x, y, rooms] of buildings) {
    const building = await query(c, "INSERT INTO edificio(clave,nombre) VALUES(?,?)", [key,name]);
    for (const [index, room] of rooms.entries()) {
      const id = await query(c, "INSERT INTO espacio(edificio_id,clave,nombre,mapa_x,mapa_y) VALUES(?,?,?,?,?)", [building.insertId,key+"-0"+(index+1),room,x,y]);
      await query(c, "INSERT INTO codigo_qr(espacio_id,version,token,emitido_por,emitido_en) VALUES(?,1,?,?,UTC_TIMESTAMP(6))", [id.insertId,randomBytes(32).toString("hex"),actor.id]);
    }
  }
  await query(c, "INSERT INTO auditoria_admin(actor_id,entidad,recurso_id,accion,motivo,creada_en) VALUES(?,'catalogo_demo','ampliacion-1','Alta','Ampliación de espacios ficticios para la exposición',UTC_TIMESTAMP(6))", [actor.id]);
}
