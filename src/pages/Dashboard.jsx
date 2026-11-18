import { Link } from "react-router-dom";
import {
  ClipboardList,
  Wrench,
  ScanLine,
  FileCheck,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Clock,

} from "lucide-react";
import { useLoad } from "../hooks/useLoad.js";
import { PageHead, Loading, IncidentTable } from "../components/ui.jsx";

export function Dashboard({ user }) {
  const tech = user.rol_id === 2;
  const admin = user.rol_id === 3;
  const staffFilter = tech ? "tecnico_id=" + user.id : "";
  const { data, error } = useLoad("/incidencias?" + staffFilter);
  if (!data) return <Loading error={error} />;
  const count = (state) => data.porEstado.find((row) => row.nombre === state)?.total || 0;
  return (
    <>
      <PageHead
        eyebrow="TU CAMPUS, EN ORDEN"
        title={
          user.rol_id === 3
            ? "Panorama del campus"
            : `Hola, ${user.nombre.split(" ")[0]}`
        }
        description={
          user.rol_id === 3
            ? "Asigna los reportes pendientes y revisa las soluciones del equipo técnico."
            : tech ? "Consulta tus asignaciones y registra la atención de cada falla." : "Aquí puedes consultar tus reportes y seguir su atención."
        }
      >
        <Link className="button primary" to="/nueva-incidencia">
          <Plus size={18} /> Nueva incidencia
        </Link>
      </PageHead>
      <section className="role-home" aria-label="Accesos de trabajo">
        {(admin ? [
          ["Pendientes de asignar", "Pendiente", Clock],
          ["Soluciones por revisar", "En revisión", FileCheck],
          ["En atención", "En proceso", Wrench],
          ["Todas las incidencias", "", ClipboardList],
        ] : tech ? [
          ["Mis asignaciones", "", ClipboardList],
          ["En reparación", "En proceso", Wrench],
          ["En revisión", "En revisión", FileCheck],
        ] : [
          ["Escanear QR", "qr", ScanLine],
          ["Mis reportes", "", ClipboardList],
          ["Por confirmar", "Resuelto", FileCheck],
        ]).map(([label, state, Icon]) => {
          const query = new URLSearchParams(staffFilter);
          if (state) query.set("estado", state);
          const scan = state === "qr";
          return <Link key={label} className="role-shortcut" to={scan ? "/nueva-incidencia?escanear=1" : "/mis-incidencias?" + query}>
            <Icon size={22} aria-hidden="true"/>
            <span>{label}</span>
            {scan ? <ArrowUpRight size={20}/> : <strong>{state ? count(state) : data.total}</strong>}
          </Link>;
        })}
      </section>
      <Link className="map-shortcut" to="/mapa">Explorar el campus <ArrowUpRight size={16}/></Link>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Actividad reciente</h2>
            <p>Los reportes más recientes de tu espacio de trabajo.</p>
          </div>
          <Link className="text-link" to="/mis-incidencias">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>
        <IncidentTable rows={data.items.slice(0, 5)} />
      </section>
      <div className="bottom-guides">
        <Link to="/nueva-incidencia">
          <span className="guide-number">01</span>
          <div>
            <h3>¿Encontraste una falla?</h3>
            <p>Ubícala y cuéntanos qué sucede.</p>
          </div>
          <ArrowUpRight />
        </Link>
        <Link to="/notificaciones">
          <span className="guide-number">02</span>
          <div>
            <h3>Sigue la atención</h3>
            <p>Revisa las novedades de tus incidencias.</p>
          </div>
          <ArrowUpRight />
        </Link>
      </div>
    </>
  );
}
