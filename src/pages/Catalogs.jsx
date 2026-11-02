import { useState } from "react";
import { Plus, X, Download } from "lucide-react";
import { post, patch } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import {
  Input,
  Select,
  Textarea,
  ErrorBox,
  Empty,
  PageHead,
  Loading,
} from "../components/ui.jsx";

export function Catalogs() {
  const { data: c, error, reload } = useLoad("/catalogos?todos=1"),
    [tab, setTab] = useState("edificio"),
    [edit, setEdit] = useState(null),
    [creating, setCreating] = useState(false),
    [err, setErr] = useState(""),
    [qr, setQr] = useState(null),
    [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      edit
        ? await patch("/catalogos/" + tab + "/" + edit.id, d)
        : await post("/catalogos/" + tab, d);
      setCreating(false);
      setEdit(null);
      reload();
    } catch (er) {
      setErr(er.message);
    } finally {
      setBusy(false);
    }
  }
  if (!c) return <Loading error={error} />;
  return (
    <>
      <PageHead
        eyebrow="INFRAESTRUCTURA Y LOCALIZACIÓN"
        title="Catálogos del campus"
        description="Mantén espacios, clasificaciones, periodos y etiquetas QR."
      >
        <button
          className="button primary"
          onClick={() => {
            setCreating(true);
            setEdit(null);
          }}
        >
          <Plus size={17} /> Agregar registro
        </button>
      </PageHead>
      <div className="tabs" role="tablist" aria-label="Catálogos">
        {Object.entries(catalogLabels).map(([k, v]) => (
          <button
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "active" : ""}
            key={k}
            onClick={() => {
              setTab(k);
              setEdit(null);
              setCreating(false);
              setQr(null);
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <ErrorBox message={err} />
      {(creating || edit) && (
        <section className="panel form-panel">
          <div className="section-head">
            <h2>{edit ? "Editar" : "Agregar"} registro</h2>
            <button
              className="icon-button"
              aria-label="Cerrar"
              onClick={() => {
                setCreating(false);
                setEdit(null);
              }}
            >
              <X size={18} />
            </button>
          </div>
          <form key={tab + "-" + (edit?.id || "new")} onSubmit={save}>
            <div className="form-grid">
              <Input
                label="Clave"
                name="clave"
                required
                maxLength={20}
                defaultValue={edit?.clave || ""}
              />
              <Input
                label="Nombre"
                name="nombre"
                required
                minLength={2}
                maxLength={100}
                defaultValue={edit?.nombre || ""}
              />
              {tab === "espacio" && (
                <>
                  <Select
                    label="Edificio"
                    name="edificio_id"
                    defaultValue={edit?.edificio_id || ""}
                    required
                  >
                    <option value="">Selecciona</option>
                    {c.edificio.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.clave} · {b.nombre}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Coordenada horizontal"
                    name="mapa_x"
                    type="number"
                    min={0}
                    max={1}
                    step="0.000001"
                    defaultValue={edit?.mapa_x ?? ""}
                    hint="Opcional. De 0 a 1 sobre la imagen completa."
                  />
                  <Input
                    label="Coordenada vertical"
                    name="mapa_y"
                    type="number"
                    min={0}
                    max={1}
                    step="0.000001"
                    defaultValue={edit?.mapa_y ?? ""}
                  />
                </>
              )}
              {tab === "periodo_escolar" && (
                <>
                  <Input
                    label="Inicio del periodo"
                    name="fecha_inicio"
                    type="date"
                    defaultValue={edit?.fecha_inicio || ""}
                    required
                  />
                  <Input
                    label="Fin del periodo"
                    name="fecha_fin"
                    type="date"
                    defaultValue={edit?.fecha_fin || ""}
                    required
                  />
                </>
              )}
              <Select
                label="Disponibilidad"
                name="activo"
                defaultValue={edit ? Number(edit.activo) : 1}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </Select>
            </div>
            <Textarea
              label="Motivo del alta o cambio"
              name="motivo"
              required
              minLength={3}
              maxLength={1000}
            />
            <div className="form-actions">
              <p className="muted">
                Desactivar conserva las referencias históricas.
              </p>
              <button className="button primary" disabled={busy}>
                Guardar registro
              </button>
            </div>
          </form>
        </section>
      )}
      {qr && (
        <section className="panel qr-label">
          <div>
            <h2>Etiqueta del espacio</h2>
            <p>Versión {qr.version} · No contiene credenciales personales.</p>
            <img
              src={qr.imagen}
              alt="Etiqueta QR para identificar el espacio"
            />
            <p>
              <a
                className="button"
                download="etiqueta-itt.png"
                href={qr.imagen}
              >
                <Download size={17} /> Descargar etiqueta
              </a>
            </p>
            <button className="text-button" onClick={() => setQr(null)}>
              Cerrar etiqueta
            </button>
          </div>
        </section>
      )}
      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Clave</th>
                <th>Nombre</th>
                {tab === "espacio" && <th>Edificio</th>}
                {tab === "periodo_escolar" && <th>Vigencia</th>}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {c[tab].map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.clave}</strong>
                  </td>
                  <td>{r.nombre}</td>
                  {tab === "espacio" && (
                    <td>
                      {c.edificio.find((b) => b.id === r.edificio_id)?.clave}
                    </td>
                  )}
                  {tab === "periodo_escolar" && (
                    <td>
                      {r.fecha_inicio} → {r.fecha_fin}
                    </td>
                  )}
                  <td>{r.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <div className="row">
                      <button
                        className="button small"
                        onClick={() => {
                          setEdit(r);
                          setCreating(false);
                        }}
                      >
                        Editar
                      </button>
                      {tab === "espacio" && r.activo && (
                        <>
                          <button
                            className="text-button"
                            onClick={async () => {
                              try {
                                setQr(
                                  await post("/espacios/" + r.id + "/qr", {}),
                                );
                              } catch (e) {
                                setErr(e.message);
                              }
                            }}
                          >
                            Etiqueta QR
                          </button>
                          <button
                            className="text-button"
                            onClick={async () => {
                              const motivo = window.prompt(
                                "Renovar invalida la etiqueta anterior. Indica el motivo:",
                              );
                              if (!motivo) return;
                              try {
                                setQr(
                                  await post("/espacios/" + r.id + "/qr", {
                                    renovar: true,
                                    motivo,
                                  }),
                                );
                              } catch (e) {
                                setErr(e.message);
                              }
                            }}
                          >
                            Renovar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!c[tab].length && <Empty />}
      </section>
    </>
  );
}

const catalogLabels = {
  edificio: "Edificios",
  espacio: "Espacios",
  tipo_falla: "Tipos de falla",
  periodo_escolar: "Periodos escolares",
};
