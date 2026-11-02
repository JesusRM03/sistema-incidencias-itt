import { useState } from "react";
import { ClipboardList, Download, Clock, CheckCircle2 } from "lucide-react";
import { date } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import { PageHead, Loading, Stat, BarGroup } from "../components/ui.jsx";
import { FilterBar } from "./Incidents.jsx";

export function Reports() {
  const [filters, setFilters] = useState({}),
    { data, error } = useLoad("/reportes?" + new URLSearchParams(filters)),
    { data: c } = useLoad("/catalogos?todos=1"),
    { data: t } = useLoad("/tecnicos");
  return (
    <>
      <PageHead
        eyebrow="ANÁLISIS INSTITUCIONAL"
        title="Reportes de atención"
        description="Convierte los reportes en información para cuidar mejor el campus."
      >
        <a
          className="button"
          href={"/api/reportes.csv?" + new URLSearchParams(filters)}
        >
          <Download size={17} /> Exportar CSV
        </a>
      </PageHead>
      <section className="panel">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          catalogs={c}
          technicians={t}
        />
      </section>
      {data ? (
        <>
          <div className="stats-grid reports-stats">
            <Stat
              label="Reportes filtrados"
              value={data.total}
              note="Según los criterios seleccionados"
              icon={ClipboardList}
            />
            <Stat
              label="Tiempo medio de resolución"
              value={
                data.tiempoMedioHoras == null
                  ? "No aplica"
                  : Number(data.tiempoMedioHoras).toFixed(1) + " h"
              }
              note="Desde el registro hasta la aprobación vigente"
              icon={Clock}
            />
            <Stat
              label="Criterio de cálculo"
              value="Resueltos"
              note="Incluye cerrados; excluye cancelados y reabiertos"
              icon={CheckCircle2}
            />
          </div>
          <div className="charts-grid">
            <BarGroup title="Estado de atención" rows={data.porEstado} />
            <BarGroup title="Tipo de falla" rows={data.porTipo} />
            <BarGroup title="Espacios reportados" rows={data.porEspacio} />
            <BarGroup title="Responsable vigente" rows={data.porTecnico} />
          </div>
          <section className="panel">
            <div className="section-head">
              <h2>Detalle del reporte</h2>
              <span className="muted">
                Mismo conjunto que el CSV · America/Mexico_City
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {data.columns.map((c) => (
                      <th key={c}>{data.labels[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id}>
                      {data.columns.map((c) => (
                        <td key={c}>
                          {c.endsWith("_en") ? date(r[c]) : r[c] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <Loading error={error} />
      )}
    </>
  );
}
