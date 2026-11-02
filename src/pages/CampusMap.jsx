import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLoad } from "../hooks/useLoad.js";
import { PageHead, Loading } from "../components/ui.jsx";
import { LocationPicker } from "../components/Location.jsx";

export function CampusMap() {
  const { data: c, error } = useLoad("/catalogos"),
    [space, setSpace] = useState("");
  if (!c) return <Loading error={error} />;
  return (
    <>
      <PageHead
        eyebrow="INFRAESTRUCTURA Y LOCALIZACIÓN"
        title="Conoce tu campus"
        description="Encuentra el espacio que necesita atención."
      />
      <section className="panel form-panel">
        <LocationPicker
          catalogs={c}
          space={space}
          setSpace={setSpace}
          mapOpen
        />
        {space && (
          <p>
            <Link
              className="button primary"
              to={"/nueva-incidencia?espacio=" + space}
              onClick={() => sessionStorage.setItem("itt_space", space)}
            >
              Reportar aquí <ArrowRight size={16} />
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
