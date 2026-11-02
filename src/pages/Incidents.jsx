import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { STATES } from "../constants.js";
import { useLoad } from "../hooks/useLoad.js";
import {
  Input,
  Select,
  PageHead,
  Loading,
  IncidentTable,
} from "../components/ui.jsx";

export function FilterBar({
  filters,
  setFilters,
  catalogs,
  technicians,
  search = true,
}) {
  const update = (k, v) => setFilters({ ...filters, [k]: v, pagina: 1 });
  return (
    <div className="filter-bar">
      {search && (
        <Input
          label="Buscar"
          value={filters.q || ""}
          placeholder="Folio o descripción"
          onChange={(e) => update("q", e.target.value)}
        />
      )}
      <Select
        label="Estado"
        value={filters.estado || ""}
        onChange={(e) => update("estado", e.target.value)}
      >
        <option value="">Todos los estados</option>
        {STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>
      <Select
        label="Tipo de falla"
        value={filters.tipo_falla_id || ""}
        onChange={(e) => update("tipo_falla_id", e.target.value)}
      >
        <option value="">Todos los tipos</option>
        {catalogs?.tipo_falla.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </Select>
      <Select
        label="Edificio"
        value={filters.edificio_id || ""}
        onChange={(e) => update("edificio_id", e.target.value)}
      >
        <option value="">Todo el campus</option>
        {catalogs?.edificio.map((t) => (
          <option key={t.id} value={t.id}>
            {t.clave} · {t.nombre}
          </option>
        ))}
      </Select>
      <Select
        label="Periodo"
        value={filters.periodo_id || ""}
        onChange={(e) => update("periodo_id", e.target.value)}
      >
        <option value="">Todos los periodos</option>
        {catalogs?.periodo_escolar.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </Select>
      <Input
        label="Desde"
        type="date"
        value={filters.desde || ""}
        onChange={(e) => update("desde", e.target.value)}
      />
      <Input
        label="Hasta"
        type="date"
        value={filters.hasta || ""}
        onChange={(e) => update("hasta", e.target.value)}
      />
      {technicians && (
        <Select
          label="Técnico"
          value={filters.tecnico_id || ""}
          onChange={(e) => update("tecnico_id", e.target.value)}
        >
          <option value="">Todos los técnicos</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
      )}
      <button className="text-button" onClick={() => setFilters({})}>
        Limpiar filtros
      </button>
    </div>
  );
}

export function Incidents({ user }) {
  const [filters, setFilters] = useState({}),
    { data, error } = useLoad("/incidencias?" + new URLSearchParams(filters)),
    { data: c } = useLoad("/catalogos");
  return (
    <>
      <PageHead
        eyebrow="REGISTRO Y SEGUIMIENTO"
        title={user.rol_id === 2 ? "Mi bandeja de atención" : "Incidencias"}
        description="Consulta cada reporte, su ubicación y el estado de atención."
      >
        <Link className="button primary" to="/nueva-incidencia">
          <Plus size={18} /> Nueva incidencia
        </Link>
      </PageHead>
      <section className="panel">
        <FilterBar filters={filters} setFilters={setFilters} catalogs={c} />
        <div className="section-head compact">
          <span className="muted">
            {data?.total || 0} incidencias encontradas
          </span>
          <span className="mini-label">VISTA SEGÚN TUS PERMISOS</span>
        </div>
        {data ? (
          <>
            <IncidentTable rows={data.items} />
            <div className="pagination">
              <span>
                Página {data.pagina} de {data.paginas}
              </span>
              <div className="row">
                <button
                  className="button small"
                  disabled={data.pagina <= 1}
                  onClick={() =>
                    setFilters({ ...filters, pagina: data.pagina - 1 })
                  }
                >
                  <ArrowLeft size={15} /> Anterior
                </button>
                <button
                  className="button small"
                  disabled={data.pagina >= data.paginas}
                  onClick={() =>
                    setFilters({ ...filters, pagina: data.pagina + 1 })
                  }
                >
                  Siguiente <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <Loading error={error} />
        )}
      </section>
    </>
  );
}
