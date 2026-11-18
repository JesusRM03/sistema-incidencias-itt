import { useState } from "react";
import { post } from "../api";

export function QrBatch({ spaces, buildings }) {
  const [labels, setLabels] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(0);
  const selected = spaces.filter((s) => s.activo && buildings.some((b) => b.id === s.edificio_id && b.activo));
  async function generateAll() {
    setBusy(true);
    setError("");
    setCompleted(0);
    const out = [];
    try {
      for (const space of selected) {
        const data = await post("/espacios/" + space.id + "/qr", {});
        out.push({
          id: space.id,
          clave: space.clave,
          nombre: space.nombre,
          edificio: buildings.find((b) => b.id === space.edificio_id)?.nombre || "",
          imagen: data.imagen,
          url: data.url,
          version: data.version,
        });
        setCompleted(out.length);
      }
      setLabels(out);
    } catch (e) {
      setError("No se pudieron preparar todas las etiquetas: " + e.message);
      setLabels(out);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel form-panel">
      <div className="section-head">
        <div>
          <h2>Etiquetas QR por salón y lugar</h2>
          <p className="muted">
            Se reutiliza cada QR vigente; sólo se crea uno si falta. Los datos de demostración son ficticios.
          </p>
        </div>
      </div>
      <p>{selected.length} espacios activos en el catálogo.</p>
      <div className="row">
        <button type="button" className="button primary" disabled={busy || selected.length === 0} onClick={generateAll}>
          {busy ? `Preparando ${completed} de ${selected.length}…` : "Preparar todas las etiquetas"}
        </button>
        {labels.length > 0 && (
          <button type="button" className="button" onClick={() => window.print()}>
            Imprimir etiquetas
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="qr-batch-grid">
        {labels.map((item) => (
          <article key={item.id} className="qr-batch-card">
            <strong>{item.clave} · {item.nombre}</strong>
            <p>{item.edificio}</p>
            <img src={item.imagen} alt={"Código QR de " + item.nombre} />
            <small>Versión {item.version}</small>
            <a href={item.url} target="_blank" rel="noreferrer">Abrir enlace QR</a>
            <a download={"ITT-" + item.clave + ".png"} href={item.imagen}>Descargar PNG</a>
          </article>
        ))}
      </div>
    </section>
  );
}
