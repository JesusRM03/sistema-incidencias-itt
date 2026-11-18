const titles = new Map([
  ["Registro", "Registró la incidencia"],
  ["Asignación", "Asignó la atención"],
  ["Clasificación", "Actualizó la clasificación"],
  ["Diagnóstico", "Registró el diagnóstico"],
  ["Avance", "Registró un avance"],
  ["Solución", "Envió la solución a revisión"],
  ["Comentario", "Añadió un comentario"],
  ["aprobar", "Aprobó la solución"],
  ["devolver", "Devolvió la incidencia a atención"],
  ["cerrar", "Confirmó el cierre"],
  ["inconformidad", "Registró que la falla continúa"],
  ["cancelar", "Canceló la incidencia"],
  ["duplicado", "Vinculó la incidencia como duplicada"],
]);

export function eventTitle(type) {
  return titles.get(type) || type;
}
