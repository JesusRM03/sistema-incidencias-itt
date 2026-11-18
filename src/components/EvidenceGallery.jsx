import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function EvidenceGallery({ photos, interventions }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef(null);
  const start = useRef(null);
  const items = [...photos].sort((a, b) => a.id - b.id);
  if (!items.length) return null;
  const current = items[Math.min(index, items.length - 1)];
  function label(photo) {
    return photo.intervencion_id
      ? interventions.find((item) => item.id === photo.intervencion_id)?.tipo || "Intervención"
      : "Reporte inicial";
  }
  function move(step) {
    setIndex((n) => Math.max(0, Math.min(items.length - 1, n + step)));
  }
  return <>
    <div className="evidence-grid">
      {items.map((photo, n) => <button type="button" key={photo.id} aria-label={`Ampliar fotografía ${n + 1} · ${label(photo)}`}
        onClick={() => { setIndex(n); dialog.current.showModal(); }}>
        <img src={"/api/evidencias/" + photo.id} alt={"Evidencia fotográfica " + (n + 1)} />
        <span>{label(photo)}</span>
      </button>)}
    </div>
    <dialog className="photo-dialog" ref={dialog} aria-label="Galería de evidencias"
      onKeyDown={(e) => { if(e.key === "ArrowLeft") move(-1); if(e.key === "ArrowRight") move(1); }}>
      <div className="gallery-toolbar">
        <strong aria-live="polite">{index + 1} de {items.length} · {label(current)}</strong>
        <button autoFocus type="button" className="icon-button" aria-label="Cerrar galería" onClick={() => dialog.current.close()}><X /></button>
      </div>
      <img src={"/api/evidencias/" + current.id} alt={label(current)}
        onTouchStart={(e) => { start.current = e.touches.length === 1 ? e.touches[0].clientX : null; }}
        onTouchEnd={(e) => {
          if(start.current === null) return;
          const distance = e.changedTouches[0].clientX - start.current;
          if(Math.abs(distance) > 50) move(distance < 0 ? 1 : -1);
          start.current = null;
        }} />
      <div className="gallery-toolbar">
        <button type="button" className="button" disabled={!index} onClick={() => move(-1)}><ChevronLeft size={18}/>Anterior</button>
        <button type="button" className="button" disabled={index >= items.length - 1} onClick={() => move(1)}>Siguiente<ChevronRight size={18}/></button>
      </div>
    </dialog>
  </>;
}
