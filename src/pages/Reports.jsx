import { useState } from "react";
import { ClipboardList, Download, Clock, ChartBar } from "lucide-react";
import { date } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import {
  PageHead,
  Loading,
  Stat,
  BarGroup,
  Select,
} from "../components/ui.jsx";
import { FilterBar } from "./Incidents.jsx";

const monthNames = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  timeZone: "UTC",
});
const monthLabels = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const currentYear = () =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date());
const monthDate = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day));
const formatRange = (year, interval) => {
  const [first, last] =
    interval === "first"
      ? [1, 6]
      : interval === "second"
        ? [7, 12]
        : interval === "year"
          ? [1, 12]
          : [Number(interval), Number(interval)];
  return {
    desde: monthDate(year, first, 1).toISOString().slice(0, 10),
    hasta: monthDate(year, last + 1, 0)
      .toISOString()
      .slice(0, 10),
  };
};

function PeriodSelector({ periods, onApply }) {
  const [year, setYear] = useState(currentYear);
  const [interval, setInterval] = useState("year");
  const years = [
    ...new Set([
      currentYear(),
      ...periods.flatMap((p) => [
        p.fecha_inicio.slice(0, 4),
        p.fecha_fin.slice(0, 4),
      ]),
    ]),
  ].sort((a, b) => Number(b) - Number(a));

  return (
    <form
      className="filter-bar report-period"
      aria-label="Periodo rápido"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(formatRange(Number(year), interval));
      }}
    >
      <Select
        label="Año de análisis"
        value={year}
        onChange={(event) => setYear(event.target.value)}
      >
        {years.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </Select>
      <Select
        label="Intervalo"
        value={interval}
        onChange={(event) => setInterval(event.target.value)}
      >
        <option value="year">Año completo</option>
        <option value="first">Primer semestre (ene–jun)</option>
        <option value="second">Segundo semestre (jul–dic)</option>
        <optgroup label="Mes">
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>
              {monthNames.format(monthDate(2024, month, 1))}
            </option>
          ))}
        </optgroup>
      </Select>
      <button type="submit" className="button">
        Aplicar periodo
      </button>
    </form>
  );
}

export function Reports() {
  const [filters, setFilters] = useState({}),
    { data, error } = useLoad("/reportes?" + new URLSearchParams(filters)),
    { data: c } = useLoad("/catalogos?todos=1"),
    { data: t } = useLoad("/tecnicos");
  const topType = data?.porTipo[0];
  const leaders =
    data?.porTipo.filter((type) => type.total === topType?.total) ?? [];
  const monthly =
    data?.porMes.map(({ nombre, total }) => ({
      nombre: monthLabels.format(new Date(nombre + "-01T00:00:00Z")),
      total,
    })) ?? [];
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
      {c?.demostracion && (
        <p className="muted">
          Datos ficticios de demostración. El histórico 2024–2025 no representa
          reportes oficiales del ITT.
        </p>
      )}
      <section className="panel">
        <PeriodSelector
          periods={c?.periodo_escolar ?? []}
          onApply={(range) =>
            setFilters((previous) => ({
              ...previous,
              ...range,
              periodo_id: "",
            }))
          }
        />
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
              note="Desde el registro hasta la aprobación, en resueltos y cerrados"
              icon={Clock}
            />
            <Stat
              label={
                leaders.length > 1
                  ? "Tipos de falla más frecuentes"
                  : "Tipo de falla más frecuente"
              }
              value={
                leaders.length
                  ? leaders.map((type) => type.nombre).join(", ")
                  : "Sin reportes"
              }
              note={
                topType &&
                (leaders.length > 1
                  ? `Empate con ${topType.total} reportes por tipo`
                  : `${topType.total} de ${data.total} reportes filtrados`)
              }
              icon={ChartBar}
            />
          </div>
          <div className="charts-grid">
            <BarGroup title="Reportes por mes" rows={monthly} />
            <BarGroup title="Tipo de falla" rows={data.porTipo} />
            <BarGroup title="Estado de atención" rows={data.porEstado} />
            <BarGroup title="Edificio" rows={data.porEdificio} />
            <BarGroup title="Periodo escolar" rows={data.porPeriodo} />
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
