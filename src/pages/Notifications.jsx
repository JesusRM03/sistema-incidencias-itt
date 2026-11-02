import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { post, date } from "../api";
import { useLoad } from "../hooks/useLoad.js";
import { ErrorBox, Empty, PageHead, Loading } from "../components/ui.jsx";

export function Notifications() {
  const { data, error, reload } = useLoad("/notificaciones"),
    [err, setErr] = useState("");
  return (
    <>
      <PageHead
        eyebrow="HISTORIAL Y AVISOS"
        title="Notificaciones"
        description="Novedades sobre el registro y la atención de las incidencias."
      />
      <ErrorBox message={err} />
      <section className="panel">
        {data ? (
          data.length ? (
            data.map((n) => (
              <article
                className={"notification " + (!n.leida_en ? "unread" : "")}
                key={n.id}
              >
                <span className="notification-icon">
                  <Bell size={20} />
                </span>
                <div>
                  <Link to={"/incidencias/" + n.incidencia_id}>
                    <strong>
                      {n.tipo} · {n.folio}
                    </strong>
                  </Link>
                  <p>{date(n.creado_en)}</p>
                </div>
                {n.leida_en ? (
                  <span className="muted">
                    <Check size={17} /> Leída
                  </span>
                ) : (
                  <button
                    className="button small"
                    onClick={async () => {
                      try {
                        await post("/notificaciones/" + n.id + "/leer");
                        reload();
                      } catch (e) {
                        setErr(e.message);
                      }
                    }}
                  >
                    Marcar como leída
                  </button>
                )}
              </article>
            ))
          ) : (
            <Empty
              title="Estás al día"
              description="Aquí aparecerán las novedades de tus reportes."
            />
          )
        ) : (
          <Loading error={error} />
        )}
      </section>
    </>
  );
}
