import { useState } from "react";
import { Plus, X } from "lucide-react";
import { post, patch } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import {
  Input,
  Select,
  Textarea,
  ErrorBox,
  PageHead,
  Loading,
} from "../components/ui.jsx";

export function Accounts() {
  const { data, error, reload } = useLoad("/usuarios"),
    [edit, setEdit] = useState(null),
    [creating, setCreating] = useState(false),
    [err, setErr] = useState(""),
    [credential, setCredential] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = edit
        ? await patch("/usuarios/" + edit.id, { ...d, version: edit.version })
        : await post("/usuarios", d);
      if (r.credencial) setCredential(r.credencial);
      setEdit(null);
      setCreating(false);
      reload();
    } catch (er) {
      setErr(er.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="ADMINISTRACIÓN DE ACCESOS"
        title="Comunidad y cuentas"
        description="Autoriza el acceso y conserva el control de los permisos institucionales."
      >
        <button
          className="button primary"
          onClick={() => {
            setCreating(true);
            setEdit(null);
          }}
        >
          <Plus size={17} /> Nueva cuenta
        </button>
      </PageHead>
      <ErrorBox message={err} />
      {credential && (
        <section className="panel form-panel">
          <h2>Credencial temporal emitida</h2>
          <p>
            Entrega este valor únicamente a la persona cuya identidad
            verificaste. Vence en 15 minutos y solo funciona una vez.
          </p>
          <code className="credential">{credential}</code>
          <button className="button" onClick={() => setCredential("")}>
            Ocultar credencial
          </button>
        </section>
      )}
      {(creating || edit) && (
        <section className="panel form-panel">
          <div className="section-head">
            <h2>
              {edit ? "Administrar cuenta" : "Registrar cuenta institucional"}
            </h2>
            <button
              className="icon-button"
              aria-label="Cerrar formulario"
              onClick={() => {
                setCreating(false);
                setEdit(null);
              }}
            >
              <X size={19} />
            </button>
          </div>
          <form key={edit?.id || "new"} onSubmit={submit}>
            <div className="form-grid">
              {!edit && (
                <>
                  <Input
                    label="Nombre completo"
                    name="nombre"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                  <Input
                    label="Correo institucional"
                    name="correo"
                    type="email"
                    required
                    placeholder="persona@toluca.tecnm.mx"
                  />
                  <Select label="Tipo de persona" name="tipo_persona">
                    <option>Alumno</option>
                    <option>Docente</option>
                    <option>Personal</option>
                  </Select>
                  <Input
                    label="Número de control o nómina"
                    name="identificador"
                    required
                    maxLength={20}
                    hint="Alumno: ocho dígitos. Personal: nómina institucional."
                  />
                </>
              )}
              <Select
                label="Rol autorizado"
                name="rol_id"
                defaultValue={edit?.rol_id || 1}
              >
                <option value={1}>Reportante</option>
                <option value={2}>Técnico</option>
                <option value={3}>Administrador</option>
              </Select>
              {edit && (
                <Select
                  label="Estado de la cuenta"
                  name="estado_cuenta"
                  defaultValue={edit.estado_cuenta}
                >
                  <option>Activa</option>
                  <option>Inactiva</option>
                  <option>Pendiente</option>
                </Select>
              )}
            </div>
            <Textarea
              label="Motivo e identidad verificada"
              name="motivo"
              minLength={3}
              maxLength={1000}
              required
            />
            <button className="button primary" disabled={busy}>
              Guardar cuenta
            </button>
          </form>
        </section>
      )}
      <section className="panel">
        {data ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Identificador</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nombre}</strong>
                      <small>{u.correo}</small>
                    </td>
                    <td>{u.identificador}</td>
                    <td>{u.rol}</td>
                    <td>{u.estado_cuenta}</td>
                    <td>
                      <div className="row">
                        <button
                          className="button small"
                          onClick={() => {
                            setEdit(u);
                            setCreating(false);
                          }}
                        >
                          Administrar
                        </button>
                        <button
                          className="text-button"
                          onClick={async () => {
                            const motivo = window.prompt(
                              "Describe cómo comprobaste la identidad para restablecer el acceso:",
                            );
                            if (!motivo) return;
                            try {
                              const r = await post(
                                "/usuarios/" + u.id + "/credencial",
                                { motivo },
                              );
                              setCredential(r.credencial);
                              reload();
                            } catch (e) {
                              setErr(e.message);
                            }
                          }}
                        >
                          Restablecer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Loading error={error} />
        )}
      </section>
    </>
  );
}
