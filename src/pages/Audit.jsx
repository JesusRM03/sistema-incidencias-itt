import { date } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import { PageHead, Loading } from "../components/ui.jsx";

export function Audit() {
  const { data, error } = useLoad("/auditoria");
  return (
    <>
      <PageHead
        eyebrow="TRAZABILIDAD ADMINISTRATIVA"
        title="Auditoría de cambios"
        description="Altas y modificaciones de cuentas, catálogos y etiquetas QR."
      />
      <section className="panel">
        {data ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Responsable</th>
                  <th>Recurso</th>
                  <th>Acción</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>{date(r.creada_en)}</td>
                    <td>{r.autor}</td>
                    <td>
                      {r.entidad} · {r.recurso_id}
                    </td>
                    <td>{r.accion}</td>
                    <td>{r.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Loading error={error} />
        )}
      </section>
    </>
  );
}
