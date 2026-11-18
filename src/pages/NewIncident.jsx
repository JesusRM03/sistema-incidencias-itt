import { reveal } from "../navigation.js";
import { FaultIcon } from "../components/FaultIcon.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ScanLine, CircleCheck } from "lucide-react";
import { api, post } from "../api";
import { newKey, draftId, readDraft, saveDraft } from "../drafts";
import { useLoad } from "../hooks/useLoad";
import {
  Select,
  Textarea,
  ErrorBox,
  PageHead,
  Loading,
} from "../components/ui";
import { LocationPicker, QRScanner, PhotoInput } from "../components/Location";

const storageWarning =
  "Este navegador solo pudo guardar el borrador en memoria. Mantén abierta esta pestaña.";
function emptyDraft() {
  return {
    key: newKey(),
    space: "",
    type: "",
    description: "",
    difference: "",
    photos: [],
    pending: false,
  };
}
export function NewIncident({ userId }) {
  const id = draftId(userId);
  const { data: catalogs, error, reload } = useLoad("/catalogos");
  const [initial, setInitial] = useState(null);
  useEffect(() => {
    let live = true;
    readDraft(id)
      .then((value) => {
        if (live) setInitial({
          value: value || emptyDraft(),
          warning: value?.savedAt === null ? storageWarning : "",
        });
      })
      .catch(() => {
        if (live) setInitial({ value: emptyDraft(), warning: storageWarning });
      });
    return () => {
      live = false;
    };
  }, [id]);
  if (!catalogs || !initial)
    return (
      <>
        <Loading error={error} />
        {error && (
          <button className="button" onClick={reload}>
            Reintentar
          </button>
        )}
      </>
    );
  return <IncidentForm id={id} initial={initial} catalogs={catalogs} />;
}
function QrConfirmation({ token, onConfirm, onCancel }) {
  const { data, error, reload } = useLoad("/qr/" + encodeURIComponent(token));
  return (
    <section
      className={"panel form-panel qr-confirm" + (data ? " qr-recognized" : "")}
      aria-label="Confirmación de ubicación"
    >
      <h2>Confirmar ubicación del QR</h2>
      {data ? (
        <>
          <p className="qr-place" role="status">
            <CircleCheck aria-hidden="true" /><strong>
              {data.clave} · {data.nombre}
            </strong>
            <br />
            {data.edificio}
          </p>
          <button
            className="button primary"
            type="button"
            onClick={() => onConfirm(String(data.id))}
          >
            Usar este salón
          </button>
        </>
      ) : (
        <>
          <Loading error={error} />
          {error && (
            <button className="button" onClick={reload}>
              Volver a consultar
            </button>
          )}
        </>
      )}
      <button type="button" className="button" onClick={onCancel}>
        Elegir otro espacio
      </button>
    </section>
  );
}
function IncidentForm({ id, initial, catalogs }) {
  const location = useLocation();
  const [draft, setDraft] = useState(initial.value),
    latest = useRef(initial.value),
    [warning, setWarning] = useState(initial.warning),
    [savingDraft, setSavingDraft] = useState(false),
    [savedAt, setSavedAt] = useState(initial.warning ? null : initial.value.savedAt),
    [error, setError] = useState(""),
    [dup, setDup] = useState([]),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [scanner, setScanner] = useState(() => new URLSearchParams(location.search).get("escanear") === "1"),
    [progress, setProgress] = useState(null),
    [invalid, setInvalid] = useState(null),
    lock = useRef(false),
    navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const qr = params.get("qr"),
    fromMap = params.get("espacio");
  const update = useCallback(
    (changes) => {
      const value = { ...latest.current, ...changes, savedAt: Date.now() };
      latest.current = value;
      setDraft(value);
      setSavingDraft(true);
      return saveDraft(id, value)
        .then(() => {
          if (latest.current !== value) return;
          setWarning("");
          setSavedAt(value.savedAt);
          setSavingDraft(false);
        })
        .catch(() => {
          if (latest.current !== value) return;
          setWarning(storageWarning);
          setSavedAt(null);
          setSavingDraft(false);
        });
    },
    [id],
  );
  const selectQr = useCallback(
    (token) => navigate("/nueva-incidencia?qr=" + token),
    [navigate],
  );
  const clearLocation = () => navigate("/nueva-incidencia", { replace: true });
  useEffect(() => {
    if (!fromMap || latest.current.pending) return;
    if (catalogs.espacio.some((s) => String(s.id) === fromMap))
      void update({ space: fromMap, difference: "" });
    navigate("/nueva-incidencia", { replace: true });
  }, [fromMap, catalogs, update, navigate]);
  useEffect(() => {
    let live = true;
    if (!draft.space || !draft.type || draft.pending) return;
    api(
      "/incidencias/coincidencias?" +
        new URLSearchParams({
          espacio_id: draft.space,
          tipo_falla_id: draft.type,
        }),
    )
      .then((rows) => {
        if (live) setDup(rows);
      })
      .catch(() => {
        /* The server also checks for duplicates on submit. */
      });
    return () => {
      live = false;
    };
  }, [draft.space, draft.type, draft.pending]);
  function select(changes) {
    if (changes.space && invalid?.name === "espacio") setInvalid(null);
    setDup([]);
    void update({ ...changes, difference: "" });
  }
  async function submit(e) {
    e.preventDefault();
    if (lock.current || reading || (qr !== null && !latest.current.pending))
      return;
    lock.current = true;
    setBusy(true);
    setProgress(null);
    setError("");
    const value = latest.current;
    try {
      await update({ pending: true });
      const result = await post(
        "/incidencias",
        {
          espacio_id: Number(value.space),
          tipo_falla_id: Number(value.type),
          descripcion: value.description,
          diferencia_duplicado: value.difference,
          fotos: value.photos.map(({ data }) => ({ data })),
        },
        { headers: { "Idempotency-Key": value.key }, onProgress: value.photos.length ? setProgress : undefined },
      );
      await saveDraft(id, null).catch(() => {});
      navigate("/incidencias/" + result.id, {
        replace: true,
        state: { registered: result.folio },
      });
    } catch (err) {
      setError(err.message);
      if (err.status >= 400 && err.status < 500 && err.status !== 401) {
        await update({ pending: false });
        if (err.coincidencias) setDup(err.coincidencias);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/mis-incidencias">
        <ArrowLeft size={16} /> Volver a incidencias
      </Link>
      <PageHead
        eyebrow="REGISTRO DE INCIDENCIAS"
        title="Reportar una incidencia"
        description="Describe la falla y confirma dónde ocurre."
      />
      {qr !== null && !draft.pending && (
        <QrConfirmation
          key={qr}
          token={qr}
          onCancel={clearLocation}
          onConfirm={(space) => {
            select({ space });
            clearLocation();
          }}
        />
      )}
      <div className="form-layout">
        <form className="panel form-panel" onSubmit={submit} onInvalidCapture={(event) => {
          const field = event.target;
          if (field !== event.currentTarget.querySelector(":is(input,select,textarea):invalid")) return;
          const messages = {
            espacio: "Elige el aula o espacio.",
            tipo: "Elige el tipo de falla.",
            descripcion: "Describe la falla con al menos 20 caracteres.",
            diferencia: "Explica qué distingue este reporte con al menos 10 caracteres.",
          };
          setInvalid({ name: field.name, message: messages[field.name] || field.validationMessage });
          requestAnimationFrame(() => reveal(field));
        }} onChange={(event) => { if (event.target.name === invalid?.name) setInvalid(null); }}>
          <fieldset
            disabled={busy || draft.pending || qr !== null}
            className="incident-fields"
          >
            <div className="form-section">
              <h2>
                <span>01</span> ¿Dónde está la falla?
              </h2>
              <LocationPicker
                catalogs={catalogs}
                invalidSpace={invalid?.name === "espacio" ? invalid.message : ""}
                space={draft.space}
                setSpace={(space) => select({ space })}
              />
              <details
                className="qr-details" open={scanner}
                onToggle={(e) => setScanner(e.currentTarget.open)}
              >
                <summary>
                  <ScanLine size={17} /> Identificar espacio por QR
                </summary>
                {scanner && !qr && <QRScanner onToken={selectQr} />}
              </details>
            </div>
            <div className="form-section">
              <h2>
                <span>02</span> Cuéntanos qué sucede
              </h2>
              <Select
                error={invalid?.name === "tipo" ? invalid.message : ""} name="tipo" label={<span className="fault-label"><FaultIcon name={catalogs.tipo_falla?.find((t) => String(t.id) === String(draft.type))?.nombre} />Tipo de falla</span>}
                value={draft.type}
                onChange={(e) => select({ type: e.target.value })}
                required
              >
                <option value="">Selecciona una categoría</option>
                {catalogs.tipo_falla.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
              <div className="fault-choices" role="group" aria-label="Categorías de falla">
                {catalogs.tipo_falla.map((t) => <button type="button" key={t.id} className="button small" aria-pressed={String(draft.type) === String(t.id)} onClick={() => {setInvalid(null); select({type:String(t.id)});}}><FaultIcon name={t.nombre} />{t.nombre}</button>)}
              </div>
              <Textarea
                label="Descripción"
                error={invalid?.name === "descripcion" ? invalid.message : ""} name="descripcion"
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="¿Qué está fallando y cómo afecta el uso del espacio?"
                minLength={20}
                maxLength={2000}
                rows={5}
                required
              />
              <PhotoInput
                photos={draft.photos}
                setPhotos={(photos) => update({ photos })}
                onReading={setReading}
              />
            </div>
            {(dup.length > 0 || draft.difference) && (
              <div className="form-section duplicate">
                <h3>Ya hay reportes similares en este espacio</h3>
                {dup.map((row) => (
                  <p key={row.folio}>
                    <strong>{row.folio}</strong> · {row.estado}
                  </p>
                ))}
                <Textarea
                  label="¿Qué hace diferente este reporte?" error={invalid?.name === "diferencia" ? invalid.message : ""} name="diferencia"
                  value={draft.difference}
                  onChange={(e) => update({ difference: e.target.value })}
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </div>
            )}
          </fieldset>
          <ErrorBox message={error || warning} />
          {busy && progress !== null && <p role="status">{progress < 100 ? `Enviando fotografías · ${progress}%` : "Fotografías enviadas. Guardando el reporte…"}</p>}
          {!busy && (
            <p role="status" className="draft-status">
              {draft.pending
                ? "Falta confirmar el registro. Reintenta para recuperar el folio con los mismos datos."
                : savingDraft
                  ? "Guardando borrador…"
                  : savedAt
                    ? "Borrador guardado en esta pestaña a las " + new Date(savedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                    : ""}
            </p>
          )}
          <div className="form-actions">
            <Link className="button" to="/mis-incidencias">
              Guardar y salir
            </Link>
            <button
              className="button primary"
              disabled={busy || reading || (qr !== null && !draft.pending)}
            >
              {busy
                ? "Registrando…"
                : draft.pending
                  ? "Reintentar envío"
                  : "Registrar incidencia"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <h3>Antes de enviar</h3>
          <p>
            Comprueba el espacio y describe cómo afecta la falla. Puedes volver
            al borrador desde esta pestaña.
          </p>
          <p>
            Al registrarlo recibirás un folio para consultar el estado y las
            respuestas.
          </p>
        </aside>
      </div>
    </>
  );
}
