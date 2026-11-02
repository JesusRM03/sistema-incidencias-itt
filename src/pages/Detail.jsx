import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { post, date } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import {
  Input,
  Select,
  Textarea,
  ErrorBox,
  Badge,
  PageHead,
  Loading,
} from "../components/ui.jsx";
import { PhotoInput } from "../components/Location.jsx";

export function Detail({ user }) {
  const { id } = useParams(),
    { data: i, error, reload } = useLoad("/incidencias/" + id),
    { data: c } = useLoad("/catalogos"),
    { data: tech } = useLoad(user.rol_id === 3 ? "/tecnicos" : "/catalogos"),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [photos, setPhotos] = useState([]),
    [success, setSuccess] = useState("");
  const admin = user.rol_id === 3;
  async function send(e, path) {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await post("/incidencias/" + id + "/" + path, {
        ...d,
        version: i.version,
        ...(path === "intervenciones" ? { fotos: photos } : {}),
      });
      setSuccess("Cambio guardado.");
      reload();
    } catch (er) {
      setErr(er.message);
      if (er.status === 409) reload();
    } finally {
      setBusy(false);
    }
  }
  if (!i) return <Loading error={error} />;
  const owner = i.reportante_id === user.id,
    assigned = i.tecnico_id === user.id;
  return (
    <>
      <Link className="back-link" to="/mis-incidencias">
        <ArrowLeft size={16} /> Todas las incidencias
      </Link>
      <PageHead
        eyebrow={i.folio}
        title={i.tipo}
        description={i.edificio + " · " + i.espacio_clave}
      >
        <Badge state={i.estado} />
        <button
          className="icon-button"
          aria-label="Actualizar incidencia"
          onClick={reload}
        >
          <RefreshCw size={18} />
        </button>
      </PageHead>
      <ErrorBox message={err} />
      {success && (
        <p className="notice success" role="status">
          <Check size={18} />
          {success}
        </p>
      )}
      <div className="detail-grid">
        <div>
          <section className="panel detail-summary">
            <div className="section-head">
              <h2>Descripción del reporte</h2>
              <span className="priority">
                {i.prioridad || "Prioridad por revisar"}
              </span>
            </div>
            <p className="description-body">{i.descripcion}</p>
            <dl className="metadata">
              <div>
                <dt>Ubicación</dt>
                <dd>
                  {i.espacio_clave} · {i.espacio}
                </dd>
              </div>
              <div>
                <dt>Fecha del reporte</dt>
                <dd>{date(i.creada_en)}</dd>
              </div>
              <div>
                <dt>Reportado por</dt>
                <dd>{i.reportante}</dd>
              </div>
              <div>
                <dt>Periodo escolar</dt>
                <dd>{i.periodo}</dd>
              </div>
              <div>
                <dt>Técnico responsable</dt>
                <dd>{i.tecnico || "Pendiente de asignación"}</dd>
              </div>
              <div>
                <dt>Última aprobación</dt>
                <dd>{date(i.resuelta_en)}</dd>
              </div>
            </dl>
            {i.evidencias.length > 0 && (
              <div className="evidence-grid">
                {i.evidencias.map((e) => (
                  <a
                    key={e.id}
                    href={"/api/evidencias/" + e.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={"/api/evidencias/" + e.id}
                      alt={"Evidencia fotográfica " + e.id}
                    />
                  </a>
                ))}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Historial de seguimiento</h2>
                <p>Cada cambio conserva su fecha y responsable.</p>
              </div>
              <Clock size={20} />
            </div>
            <ol className="timeline">
              {i.historial.map((h) => (
                <li key={h.id}>
                  <span className="timeline-dot" />
                  <div className="timeline-heading">
                    <strong>{h.tipo}</strong>
                    <time>{date(h.creado_en)}</time>
                  </div>
                  <p>{h.motivo}</p>
                  <small>
                    {h.autor} ·{" "}
                    {h.estado_anterior && h.estado_anterior !== h.estado_nuevo
                      ? h.estado_anterior + " → "
                      : ""}
                    {h.estado_nuevo}
                    {h.visibilidad === "Interna" ? " · Nota interna" : ""}
                  </small>
                </li>
              ))}
            </ol>
          </section>
          {i.asignaciones.length > 0 && (
            <details className="panel disclosure">
              <summary>Historial de responsables</summary>
              {i.asignaciones.map((a) => (
                <p key={a.id}>
                  <strong>{a.tecnico}</strong> · {date(a.inicio_en)}
                  {a.fin_en ? " → " + date(a.fin_en) : " · Vigente"}
                  <br />
                  {a.motivo}
                </p>
              ))}
            </details>
          )}
        </div>
        <aside className="detail-actions">
          {admin && !["Cerrado", "Cancelado"].includes(i.estado) && (
            <section className="panel form-panel">
              <h2>Revisión y prioridad</h2>
              <form onSubmit={(e) => send(e, "acciones")}>
                <input type="hidden" name="accion" value="priorizar" />
                <Select
                  label="Prioridad"
                  name="prioridad"
                  defaultValue={i.prioridad || "Media"}
                >
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </Select>
                <Select
                  label="Tipo de falla"
                  name="tipo_falla_id"
                  defaultValue={i.tipo_falla_id}
                >
                  {c?.tipo_falla.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Espacio"
                  name="espacio_id"
                  defaultValue={i.espacio_id}
                >
                  {c?.espacio.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.clave} · {t.nombre}
                    </option>
                  ))}
                </Select>
                <Textarea
                  label="Motivo de la clasificación o cambio"
                  name="motivo"
                  required
                  minLength={3}
                  maxLength={1000}
                />
                <button className="button full" disabled={busy}>
                  Guardar clasificación
                </button>
              </form>
            </section>
          )}
          {admin && ["Pendiente", "En proceso"].includes(i.estado) && (
            <section className="panel form-panel">
              <h2>{i.tecnico ? "Reasignar atención" : "Asignar atención"}</h2>
              <form onSubmit={(e) => send(e, "asignaciones")}>
                <Select
                  label="Técnico responsable"
                  name="tecnico_id"
                  required
                  defaultValue=""
                >
                  <option value="">Selecciona un técnico</option>
                  {Array.isArray(tech) &&
                    tech.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                </Select>
                <Textarea
                  label="Motivo de asignación"
                  name="motivo"
                  minLength={3}
                  maxLength={1000}
                  required
                />
                <button className="button primary full" disabled={busy}>
                  Confirmar asignación
                </button>
              </form>
            </section>
          )}
          {(admin || assigned) && i.estado === "En proceso" && (
            <section className="panel form-panel">
              <h2>Registrar intervención</h2>
              <form onSubmit={(e) => send(e, "intervenciones")}>
                <Select label="Tipo de intervención" name="tipo">
                  <option>Diagnóstico</option>
                  <option>Avance</option>
                  <option>Solución</option>
                  <option>Comentario</option>
                </Select>
                <Select label="Visibilidad" name="visibilidad">
                  <option>Pública</option>
                  <option>Interna</option>
                </Select>
                <Textarea
                  label="Detalle de la intervención"
                  name="texto"
                  required
                  maxLength={2000}
                />
                {admin && (
                  <Textarea
                    label="Motivo de intervención administrativa"
                    name="motivo"
                    required
                    minLength={3}
                  />
                )}
                <PhotoInput setPhotos={setPhotos} />
                <p className="muted">
                  Una solución se envía a revisión; no cierra el reporte.
                </p>
                <button className="button primary full" disabled={busy}>
                  Guardar intervención
                </button>
              </form>
            </section>
          )}
          {admin && i.estado === "En revisión" && (
            <ActionForm
              title="Validar solución técnica"
              actions={["aprobar", "devolver"]}
              send={send}
              busy={busy}
            />
          )}{" "}
          {(owner || admin) && i.estado === "Resuelto" && (
            <ActionForm
              title={
                owner ? "¿La falla quedó solucionada?" : "Verificar cierre"
              }
              actions={["cerrar", "inconformidad"]}
              send={send}
              busy={busy}
            />
          )}{" "}
          {admin && ["Pendiente", "En proceso"].includes(i.estado) && (
            <ActionForm
              title="Cancelar o vincular duplicado"
              actions={["cancelar", "duplicado"]}
              send={send}
              busy={busy}
            />
          )}{" "}
          {["Cerrado", "Cancelado"].includes(i.estado) && (
            <div className="form-aside">
              <CheckCircle2 size={26} />
              <h3>Seguimiento finalizado</h3>
              <p>
                El historial se conserva. Si la falla vuelve a ocurrir, registra
                una nueva incidencia.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export function ActionForm({ title, actions, send, busy }) {
  const [action, setAction] = useState(actions[0]);
  return (
    <section className="panel form-panel">
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          if (window.confirm("¿Confirmas esta acción?")) send(e, "acciones");
          else e.preventDefault();
        }}
      >
        <Select
          label="Acción"
          name="accion"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          {actions.map((a) => (
            <option key={a} value={a}>
              {actionLabels[a]}
            </option>
          ))}
        </Select>
        {action === "duplicado" && (
          <Input
            label="Folio principal"
            name="principal_folio"
            type="text"
            maxLength={30}
            required
          />
        )}
        <Textarea
          label="Motivo o verificación"
          name="motivo"
          required
          minLength={3}
          maxLength={1000}
        />
        <button className="button primary full" disabled={busy}>
          Confirmar acción
        </button>
      </form>
    </section>
  );
}

const actionLabels = {
  aprobar: "Aprobar solución",
  devolver: "Devolver a atención",
  cerrar: "Confirmar cierre",
  inconformidad: "La falla continúa",
  cancelar: "Cancelar incidencia",
  duplicado: "Vincular y cancelar duplicado",
};
