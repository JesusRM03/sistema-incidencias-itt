import { EvidenceGallery } from "../components/EvidenceGallery.jsx";
import { reveal } from "../navigation.js";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, RefreshCw, Clock, CheckCircle2, Copy, ClipboardList, UserRoundCheck, Wrench, FileCheck, MessageSquare } from "lucide-react";
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

const nextStep = {
  Pendiente: "El administrador revisa la falla y asigna a un técnico.",
  "En proceso": "El técnico responsable registra el diagnóstico y la reparación.",
  "En revisión": "El administrador revisa la solución y la evidencia.",
  Resuelto: "El reportante confirma si la falla quedó solucionada.",
  Cerrado: "El seguimiento terminó. Puedes consultar el historial y las evidencias.",
  Cancelado: "El historial conserva el motivo de la cancelación.",
};
function EventIcon({type}) {
  const Icon = ({Asignación: UserRoundCheck, Diagnóstico: Wrench, Avance: Wrench, Solución: Wrench, aprobar: FileCheck, cerrar: CheckCircle2, Comentario: MessageSquare})[type] || ClipboardList;
  return <Icon size={14} aria-hidden="true"/>;
}
const feedback = {
  priorizar: "Clasificación y prioridad actualizadas.", aprobar: "Solución aprobada. Ya puede confirmarse el cierre.",
  devolver: "Incidencia devuelta a atención.", cerrar: "Incidencia cerrada.", inconformidad: "Inconformidad registrada. El caso vuelve a atención.",
  cancelar: "Incidencia cancelada. Se conservó el historial.", duplicado: "Duplicado vinculado al folio principal.",
};
export function Detail({ user }) {
  const { id } = useParams(),
    { data: i, error, reload } = useLoad("/incidencias/" + id),
    { data: c } = useLoad("/catalogos"),
    { data: tech } = useLoad(user.rol_id === 3 ? "/tecnicos" : "/catalogos"),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [photos, setPhotos] = useState([]),
    [success, setSuccess] = useState("");
  const location = useLocation();
  const [reading, setReading] = useState(false);
  const admin = user.rol_id === 3;
  const sending = useRef(false);
  const [progress, setProgress] = useState(null);
  const navigate = useNavigate();
  const openedId = i?.id;
  useEffect(() => {
    if (!openedId || !/^#evento-\d+$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    reveal(target || document.getElementById("historial"));
  }, [openedId, location.hash]);
  async function copyFolio() {
    try {
      await navigator.clipboard.writeText(i.folio);
      setSuccess("Folio copiado: " + i.folio);
    } catch {
      setErr("Selecciona y copia el folio " + i.folio + " manualmente.");
    }
  }
  async function send(e, path) {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setProgress(null);
    setErr("");
    setSuccess("");
    setBusy(true);
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    try {
      await post("/incidencias/" + id + "/" + path, {
        ...d,
        version: i.version,
        ...(path === "intervenciones"
          ? { fotos: photos.map(({ data }) => ({ data })) }
          : {}),
      }, {onProgress: path === "intervenciones" && photos.length ? setProgress : undefined});
      if (path === "intervenciones") {
        form.reset();
        setPhotos([]);
      }
      if (path === "asignaciones") {
        const name = tech?.find((t) => String(t.id) === d.tecnico_id)?.nombre;
        setSuccess(name ? "Incidencia asignada a " + name + "." : "Asignación guardada.");
      } else if (path === "intervenciones") {
        setSuccess(d.tipo === "Solución" ? "Solución enviada a revisión." : d.tipo + " registrado en el historial.");
      } else setSuccess(feedback[d.accion] || "Cambio guardado.");
      reload();
    } catch (er) {
      setErr(er.message);
      if (er.status === 409) reload();
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (!i) return <Loading error={error} />;
  const owner = i.reportante_id === user.id,
    assigned = i.tecnico_id === user.id;
  const canClassify = admin && !["Cerrado", "Cancelado"].includes(i.estado);
  const canAssign = admin && ["Pendiente", "En proceso"].includes(i.estado);
  const canIntervene = (admin || assigned) && i.estado === "En proceso";
  const canReview = admin && i.estado === "En revisión";
  const canClose = (owner || admin) && i.estado === "Resuelto";
  const sections = [
    [canClassify, "prioridad", "Clasificar"], [canAssign, "asignar", i.tecnico ? "Reasignar" : "Asignar"],
    [canIntervene, "intervenir", "Registrar avance"], [canReview, "revisar", "Revisar solución"],
    [canClose, "cierre", "Verificar cierre"], [true, "historial", "Historial"],
  ];
  return (
    <>
      <Link className="back-link" to={location.state?.list || "/mis-incidencias"} onClick={(event) => {
        if (location.state?.list && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(-1); }
      }}>
        <ArrowLeft size={16} /> Todas las incidencias
      </Link>
      <PageHead
        eyebrow={i.folio}
        title={i.tipo}
        description={i.edificio + " · " + i.espacio_clave}
      >
        <Badge state={i.estado} />
        <button className="button small" onClick={copyFolio}><Copy size={16}/> Copiar folio</button>
        <button
          className="icon-button"
          aria-label="Actualizar incidencia"
          onClick={reload}
        >
          <RefreshCw size={18} />
        </button>
      </PageHead>
      {location.state?.registered && (
        <p className="notice success" role="status">
          Incidencia registrada. Folio {location.state.registered}
        </p>
      )}
      <div className="case-guide">
        <p><strong>{i.estado}</strong> · {nextStep[i.estado]}</p>
        <div aria-label="Apartados de la incidencia" role="group">
          {sections.filter(([visible]) => visible).map(([, target, title]) => <button className="button small" key={target} onClick={() => reveal(document.getElementById(target))}>{title}</button>)}
        </div>
      </div>
      <ErrorBox message={err} />
      {success && (
        <p className="notice success case-feedback" role="status">
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
            <EvidenceGallery photos={i.evidencias} interventions={i.intervenciones} />
          </section>
          <section id="historial" tabIndex={-1} className="panel case-section">
            <div className="section-head">
              <div>
                <h2>Historial de seguimiento</h2>
                <p>Cada cambio conserva su fecha y responsable.</p>
              </div>
              <Clock size={20} />
            </div>
            <ol className="timeline">
              {i.historial.map((h) => (
                <li key={h.id} id={"evento-" + h.id} aria-current={location.hash === "#evento-" + h.id ? "location" : undefined} tabIndex={-1}>
                  <span className="event-icon"><EventIcon type={h.tipo}/></span>
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
          {canClassify && (
            <section tabIndex={-1} id="prioridad" className="panel form-panel case-section">
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
          {canAssign && (
            <section tabIndex={-1} id="asignar" className="panel form-panel case-section">
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
          {canIntervene && (
            <section tabIndex={-1} id="intervenir" className="panel form-panel case-section">
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
                <PhotoInput
                  photos={photos}
                  setPhotos={setPhotos}
                  onReading={setReading}
                />
                {busy && progress !== null && <p role="status">{progress < 100 ? `Enviando fotografías · ${progress}%` : "Fotografías enviadas. Guardando intervención…"}</p>}
                <p className="muted">
                  Una solución se envía a revisión; no cierra el reporte.
                </p>
                <button
                  className="button primary full"
                  disabled={busy || reading}
                >
                  Guardar intervención
                </button>
              </form>
            </section>
          )}
          {canReview && (
            <ActionForm id="revisar"
              title="Validar solución técnica"
              actions={
                i.intervenciones.some((v) => v.autor_id === user.id)
                  ? ["devolver"]
                  : ["aprobar", "devolver"]
              }
              send={send}
              busy={busy}
            />
          )}{" "}
          {canClose && (
            <ActionForm id="cierre"
              title={
                owner ? "¿La falla quedó solucionada?" : "Verificar cierre"
              }
              actions={["cerrar", "inconformidad"]}
              send={send}
              busy={busy}
            />
          )}{" "}
          {canAssign && (
            <details className="panel disclosure more-actions"><summary>Más acciones</summary><ActionForm
              title="Cancelar o vincular duplicado"
              actions={["cancelar", "duplicado"]}
              send={send}
              busy={busy}
            /></details>
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

export function ActionForm({ id, title, actions, send, busy }) {
  const [action, setAction] = useState(actions[0]);
  return (
    <section id={id} tabIndex={-1} className="panel form-panel case-section">
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
