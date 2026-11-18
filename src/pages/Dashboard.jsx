import { Link } from "react-router-dom";
import {
  ClipboardList,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useLoad } from "../hooks/useLoad.js";
import { PageHead, Loading, Stat, IncidentTable } from "../components/ui.jsx";

export function Dashboard({ user }) {
  const { data, error } = useLoad("/incidencias");
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
            ? "Una vista de las necesidades y la atención de nuestros espacios."
            : "Aquí puedes consultar tus reportes y seguir su atención."
        }
      >
        <Link className="button primary" to="/nueva-incidencia">
          <Plus size={18} /> Nueva incidencia
        </Link>
      </PageHead>
      <section className="overview-banner">
        <div>
          <span className="mini-label light">COMUNIDAD ITT</span>
          <h2>
            Espacios que funcionan.
            <br />
            Una comunidad que avanza.
          </h2>
          <p>Cada reporte ayuda a dar atención al lugar que compartimos.</p>
          <Link to="/mapa">
            Explorar el campus <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="campus-art" aria-hidden="true">
          <div className="art-window" />
          <div className="art-building">T</div>
          <div className="art-tree" />
          <span>INSTITUTO TECNOLÓGICO DE TOLUCA</span>
        </div>
      </section>
      <div className="stats-grid">
        <Stat
          label="Incidencias"
          value={data.total}
          note="En tu ámbito de consulta"
          icon={ClipboardList}
        />
        <Stat
          label="Por atender"
          value={count("Pendiente")}
          note="Pendientes de asignación"
          icon={Clock}
        />
        <Stat
          label="En atención"
          value={count("En proceso") + count("En revisión")}
          note="Proceso y revisión"
          icon={Settings}
        />
        <Stat
          label="Soluciones"
          value={count("Resuelto") + count("Cerrado")}
          note="Resueltas y cerradas"
          icon={CheckCircle2}
        />
      </div>
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
