import { FaultIcon } from "../components/FaultIcon.jsx";
import { useLayoutEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
        label={<span className="fault-label"><FaultIcon name={catalogs?.tipo_falla?.find((t) => String(t.id) === String(filters.tipo_falla_id))?.nombre} />Tipo de falla</span>}
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
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const filters = Object.fromEntries(params);
  const { data, error } = useLoad("/incidencias?" + params);
  const { data: c } = useLoad("/catalogos");
  const storageKey = "itt:lista:" + user.id + ":" + location.key;
  const restored = useRef("");
  function setFilters(values) {
    setParams(Object.entries(values).filter(([, value]) => value !== "" && value != null), {replace: true});
  }
  function rememberPosition(event) {
    if (!event.target.closest("a") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try { sessionStorage.setItem(storageKey, String(window.scrollY)); } catch { /* Storage is optional. */ }
  }
  useLayoutEffect(() => {
    if (!data || restored.current === storageKey) return;
    restored.current = storageKey;
    try {
      const y = sessionStorage.getItem(storageKey);
      if (y !== null) {
        window.scrollTo({top: Number(y), behavior: "instant"});
        sessionStorage.removeItem(storageKey);
      }
    } catch { /* The list remains usable without storage. */ }
  }, [storageKey, data]);
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
        {filters.tecnico_id && <p className="muted">Filtro activo: {String(user.id) === filters.tecnico_id ? "mis asignaciones" : "técnico seleccionado"}</p>}
        <div className="section-head compact">
          <span className="muted">
            {data?.total || 0} incidencias encontradas
          </span>
          <span className="mini-label">VISTA SEGÚN TUS PERMISOS</span>
        </div>
        {data ? (
          <>
            <IncidentTable rows={data.items} list={location.pathname + location.search} rememberPosition={rememberPosition} />
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
