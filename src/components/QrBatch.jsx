import { useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { post } from "../api";
import { labelArtwork, downloadBatch } from "../labels";
import { ErrorBox } from "./ui";

export function QrLabels({ labels }) {
  const [printing, setPrinting] = useState(false),
    [error, setError] = useState("");
  async function print() {
    flushSync(() => setPrinting(true));
    try {
      await Promise.all(
        [...document.querySelectorAll(".qr-print-sheet img")].map((img) =>
          img.decode(),
        ),
      );
      window.print();
    } catch {
      setError(
        "No se pudo preparar la impresión. Descarga las etiquetas en PNG.",
      );
    } finally {
      setPrinting(false);
    }
  }
  return (
    <>
      <div className="row">
        <button type="button" className="button" onClick={print}>
          {labels.length === 1 ? "Imprimir etiqueta" : "Imprimir etiquetas"}
        </button>
        {labels.length > 1 && (
          <button
            type="button"
            className="button"
            onClick={() =>
              downloadBatch(labels).catch(() =>
                setError("No se pudo crear la descarga."),
              )
            }
          >
            Descargar lote ZIP
          </button>
        )}
      </div>
      <ErrorBox message={error} />
      <div className="qr-batch-grid">
        {labels.map((item) => (
          <article className="qr-batch-card" key={item.id}>
            <img
              src={item.png}
              alt={
                item.edificio +
                " · " +
                item.clave +
                " · " +
                item.nombre +
                " · versión " +
                item.version
              }
            />
            <a href={item.url} target="_blank" rel="noreferrer">
              Abrir enlace QR
            </a>
            <a download={item.filename} href={item.png}>
              Descargar PNG
            </a>
          </article>
        ))}
      </div>
      {printing &&
        createPortal(
          <div className="qr-print-sheet">
            {labels.map((item) => (
              <img key={item.id} src={item.png} alt={item.clave} />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
export function QrBatch({ spaces, buildings }) {
  const [labels, setLabels] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [completed, setCompleted] = useState(0);
  const selected = spaces.filter(
    (s) =>
      s.activo && buildings.some((b) => b.id === s.edificio_id && b.activo),
  );
  async function generateAll() {
    setBusy(true);
    setLabels([]);
    setError("");
    setCompleted(0);
    const out = [];
    try {
      for (const space of selected) {
        out.push(
          await labelArtwork(await post("/espacios/" + space.id + "/qr")),
        );
        setCompleted(out.length);
      }
      setLabels(out);
    } catch (e) {
      setError(
        "Preparación interrumpida. Puedes reintentar sin cambiar los QR vigentes. " +
          e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel form-panel">
      <h2>Etiquetas QR por salón y lugar</h2>
      <p>
        {selected.length} espacios activos. La descarga conserva la versión
        vigente.
      </p>
      <button
        type="button"
        className="button primary"
        disabled={busy || !selected.length}
        onClick={generateAll}
      >
        {busy
          ? `Preparando ${completed} de ${selected.length}…`
          : "Preparar todas las etiquetas"}
      </button>
      <ErrorBox message={error} />
      {labels.length > 0 && <QrLabels labels={labels} />}
    </section>
  );
}
