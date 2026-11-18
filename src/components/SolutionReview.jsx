import { useState } from "react";
import { date } from "../api";
import { EvidenceGallery } from "./EvidenceGallery.jsx";

export function SolutionReview({ incident }) {
  const [view, setView] = useState("reported");
  const { intervenciones: interventions, evidencias: photos } = incident;
  const solution = interventions.findLast((entry) => entry.tipo === "Solución");
  const lastReturn = incident.historial.findLast(
    (event) => event.tipo === "devolver" || event.tipo === "inconformidad",
  );
  const diagnosis = interventions.findLast(
    (entry) =>
      entry.tipo === "Diagnóstico" &&
      (!solution || entry.id < solution.id) &&
      (!lastReturn || entry.creada_en >= lastReturn.creado_en) &&
      photos.some((photo) => photo.intervencion_id === entry.id),
  );
  const reportedPhotos = photos.filter((photo) => !photo.intervencion_id);
  const solutionPhotos = photos.filter(
    (photo) => photo.intervencion_id === solution?.id,
  );
  const diagnosisPhotos = photos.filter(
    (photo) => photo.intervencion_id === diagnosis?.id,
  );
  return (
    <>
      <div
        className="review-switch"
        role="group"
        aria-label="Comparar evidencias"
      >
        <button
          type="button"
          className="button small"
          aria-pressed={view === "reported"}
          onClick={() => setView("reported")}
        >
          Reporte inicial
        </button>
        <button
          type="button"
          className="button small"
          aria-pressed={view === "solution"}
          onClick={() => setView("solution")}
        >
          Solución
        </button>
      </div>
      <div className="review-comparison" data-view={view}>
        <article className="review-reported">
          <h3>Reporte inicial</h3>
          <small>
            {incident.reportante} · {date(incident.creada_en)}
          </small>
          <p>{incident.descripcion}</p>
          {reportedPhotos.length ? (
            <EvidenceGallery
              photos={reportedPhotos}
              interventions={interventions}
            />
          ) : (
            <p className="muted">
              El reporte inicial se registró sin fotografías.
            </p>
          )}
        </article>
        <article className="review-solution">
          <h3>Solución registrada</h3>
          {solution ? (
            <>
              <small>
                {solution.autor} · {date(solution.creada_en)}
                {solution.visibilidad === "Interna" ? " · Nota interna" : ""}
              </small>
              <p>{solution.texto}</p>
            </>
          ) : (
            <p className="muted">
              La descripción de la solución no está disponible.
            </p>
          )}
          {solutionPhotos.length ? (
            <EvidenceGallery
              photos={solutionPhotos}
              interventions={interventions}
            />
          ) : (
            <>
              <p className="muted">La solución se registró sin fotografías.</p>
              {diagnosisPhotos.length > 0 && (
                <>
                  <h4>Fotografías del diagnóstico</h4>
                  <EvidenceGallery
                    photos={diagnosisPhotos}
                    interventions={interventions}
                  />
                </>
              )}
            </>
          )}
        </article>
      </div>
    </>
  );
}
