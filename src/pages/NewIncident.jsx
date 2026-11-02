import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ScanLine } from "lucide-react";
import { api, post } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import {
  Select,
  Textarea,
  ErrorBox,
  PageHead,
  Loading,
} from "../components/ui.jsx";
import {
  LocationPicker,
  QRScanner,
  PhotoInput,
} from "../components/Location.jsx";

export function NewIncident() {
  const { data: c, error } = useLoad("/catalogos"),
    [space, setSpace] = useState(
      () => sessionStorage.getItem("itt_space") || "",
    ),
    [type, setType] = useState(""),
    [photos, setPhotos] = useState([]),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [dup, setDup] = useState([]),
    key = useRef(crypto.randomUUID()),
    navigate = useNavigate();
  useEffect(() => {
    sessionStorage.removeItem("itt_space");
    const qr = sessionStorage.getItem("itt_qr");
    if (qr)
      api("/qr/" + encodeURIComponent(qr))
        .then((e) => {
          setSpace(String(e.id));
          sessionStorage.removeItem("itt_qr");
        })
        .catch((e) => setErr(e.message));
  }, []);
  useEffect(() => {
    if (!space || !type) return;
    let live = true;
    api(
      "/incidencias/coincidencias?" +
        new URLSearchParams({ espacio_id: space, tipo_falla_id: type }),
    )
      .then((d) => {
        if (live) setDup(d);
      })
      .catch(() => {
        if (live) setDup([]);
      });
    return () => {
      live = false;
    };
  }, [space, type]);
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await post(
        "/incidencias",
        {
          ...values,
          espacio_id: Number(space),
          tipo_falla_id: Number(type),
          fotos: photos,
        },
        { headers: { "Idempotency-Key": key.current } },
      );
      navigate("/incidencias/" + r.id);
    } catch (er) {
      setErr(er.message);
      if (er.coincidencias) setDup(er.coincidencias);
    } finally {
      setBusy(false);
    }
  }
  if (!c) return <Loading error={error} />;
  return (
    <>
      <Link className="back-link" to="/mis-incidencias">
        <ArrowLeft size={16} /> Volver a incidencias
      </Link>
      <PageHead
        eyebrow="AYÚDANOS A CUIDAR EL CAMPUS"
        title="Reportar una incidencia"
        description="Describe la falla y confirma dónde ocurre. Nosotros le damos seguimiento."
      />
      <div className="form-layout">
        <form className="panel form-panel" onSubmit={submit}>
          <div className="form-section">
            <h2>
              <span>01</span> ¿Dónde está la falla?
            </h2>
            <p>Selecciona un espacio por catálogo, mapa o etiqueta QR.</p>
            <LocationPicker catalogs={c} space={space} setSpace={setSpace} />
            <details className="qr-details">
              <summary>
                <ScanLine size={17} /> Identificar espacio por QR
              </summary>
              <QRScanner onSelect={setSpace} />
            </details>
          </div>
          <div className="form-section">
            <h2>
              <span>02</span> Cuéntanos qué sucede
            </h2>
            <Select
              label="Tipo de falla"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Selecciona una categoría</option>
              {c.tipo_falla.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
            <Textarea
              label="Descripción"
              name="descripcion"
              placeholder="¿Qué está fallando y cómo afecta el uso del espacio?"
              minLength={20}
              maxLength={2000}
              rows={5}
              required
            />
            <PhotoInput setPhotos={setPhotos} />
          </div>
          {dup.length > 0 && (
            <div className="form-section duplicate">
              <h3>Ya hay reportes similares en este espacio</h3>
              <p>
                Revísalos antes de continuar. Solo se muestran datos mínimos
                para proteger la privacidad.
              </p>
              {dup.map((i) => (
                <p key={i.folio}>
                  <strong>{i.folio}</strong> · {i.estado}
                </p>
              ))}
              <Textarea
                label="¿Qué hace diferente este reporte?"
                name="diferencia_duplicado"
                minLength={10}
                maxLength={1000}
                required
              />
            </div>
          )}
          <ErrorBox message={err} />
          <div className="form-actions">
            <Link className="button" to="/mis-incidencias">
              Cancelar
            </Link>
            <button className="button primary" disabled={busy}>
              {busy ? "Registrando…" : "Registrar incidencia"}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <span className="mini-label">UN BUEN REPORTE AYUDA</span>
          <h3>
            Los detalles hacen
            <br />
            la diferencia.
          </h3>
          <ol>
            <li>Elige el aula o espacio exacto.</li>
            <li>Describe lo que observaste.</li>
            <li>Si puedes, agrega una fotografía.</li>
          </ol>
          <hr />
          <p>
            Tu reporte recibirá un folio y comenzará en estado{" "}
            <strong>Pendiente</strong>. La prioridad la define administración.
          </p>
          <p className="muted">
            Si se trata de un riesgo inmediato, avisa también al personal del
            campus.
          </p>
        </aside>
      </div>
    </>
  );
}
