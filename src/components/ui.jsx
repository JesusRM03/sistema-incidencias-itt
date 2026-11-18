import { FaultIcon } from "./FaultIcon.jsx";
import { useId } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ArrowUpRight, AlertCircle } from "lucide-react";
import { STATES } from "../constants.js";

export function Field({ label, children, hint, error }) {
  const rid = useId();
  return (
    <div className="field">
      <label htmlFor={rid}>{label}</label>
      {typeof children === "function" ? children(rid, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? rid + "-error" : hint ? rid + "-hint" : undefined,
      }) : children}
      {error && <small className="field-error" id={rid + "-error"} role="alert">{error}</small>}
      {hint && <small id={rid + "-hint"}>{hint}</small>}
    </div>
  );
}

export function Input({ label, hint, ...props }) {
  return (
    <Field label={label} hint={hint}>
      {(rid) => <input id={rid} {...props} />}
    </Field>
  );
}

export function Select({ label, children, error, hint, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(rid, validation) => (
        <select id={rid} {...validation} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <Field label={label} error={error}>{(rid, validation) => <textarea id={rid} {...validation} {...props} />}</Field>
  );
}

export function ErrorBox({ message }) {
  return message ? (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  ) : null;
}

export function Badge({ state }) {
  return (
    <span className={"badge s-" + STATES.indexOf(state)}>
      <i />
      {state}
    </span>
  );
}

export function Empty({
  title = "Todavía no hay registros",
  description = "Los registros aparecerán aquí cuando estén disponibles.",
}) {
  return (
    <div className="empty">
      <ClipboardList size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function PageHead({ eyebrow, title, description, children }) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

export function Loading({ error }) {
  return error ? (
    <ErrorBox message={error} />
  ) : (
    <p className="muted loading" role="status">
      Cargando información…
    </p>
  );
}

export function Stat({ label, value, note, icon: Icon }) {
  return (
    <article className="stat">
      <div className="stat-label">
        {label}
        {Icon && <Icon size={18} />}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function IncidentTable({ rows, list, rememberPosition }) {
  return rows.length ? (
    <div onClickCapture={rememberPosition}>
      <div className="incident-cards">
        {rows.map((i) => <Link className="incident-card" key={i.id} to={"/incidencias/" + i.id} state={list ? {list} : null}>
          <span className="card-heading"><strong>{i.folio}</strong><Badge state={i.estado}/></span>
          <span className="fault-label"><FaultIcon name={i.tipo}/>{i.tipo}</span>
          <span>{i.espacio_clave} · {i.edificio}</span>
          <small>{i.prioridad || "Prioridad por revisar"} · {i.tecnico || "Sin asignar"}</small>
        </Link>)}
      </div>
      <div className="table-scroll incident-desktop">
      <table>
        <thead>
          <tr>
            <th>Folio y descripción</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Responsable</th>
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <Link state={list ? {list} : null} className="folio" to={"/incidencias/" + i.id}>
                  {i.folio}
                </Link>
                <small className="fault-label"><FaultIcon name={i.tipo} />{i.tipo}</small>
                <span className="table-description">{i.descripcion}</span>
              </td>
              <td>
                <strong>{i.espacio_clave}</strong>
                <small>{i.edificio}</small>
              </td>
              <td>
                <Badge state={i.estado} />
              </td>
              <td>
                <span
                  className={
                    "priority " + (i.prioridad === "Alta" ? "high" : "")
                  }
                >
                  {i.prioridad || "Por revisar"}
                </span>
              </td>
              <td>{i.tecnico || <span className="muted">Sin asignar</span>}</td>
              <td>
                <Link
                  className="icon-button" state={list ? {list} : null}
                  to={"/incidencias/" + i.id}
                  aria-label={"Abrir " + i.folio}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div></div>
  ) : (
    <Empty />
  );
}

export function BarGroup({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      {rows.length ? (
        rows.map((r) => (
          <div className="bar-row" key={r.nombre}>
            <div>
              <span>{r.nombre}</span>
              <strong>{r.total}</strong>
            </div>
            <div className="bar-track">
              <div style={{ width: (r.total / max) * 100 + "%" }} />
            </div>
          </div>
        ))
      ) : (
        <p className="muted">Sin datos para los filtros.</p>
      )}
    </section>
  );
}
