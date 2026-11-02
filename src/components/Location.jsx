import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Paperclip, ScanLine } from "lucide-react";
import { api, photosToJSON } from "../api";
import map from "../assets/mapa-itt.jpg";
import jsQR from "jsqr";
import { Field, Input, Select, ErrorBox } from "./ui.jsx";

export function LocationPicker({
  catalogs,
  space,
  setSpace,
  showMap = true,
  mapOpen = false,
}) {
  const [building, setBuilding] = useState("");
  const spaces =
    catalogs?.espacio.filter(
      (e) =>
        catalogs.edificio.some((b) => b.id === e.edificio_id && b.activo) &&
        e.activo,
    ) || [];
  const selected = spaces.find((e) => String(e.id) === String(space));
  return (
    <>
      <div className="form-grid">
        <Select
          label="Edificio"
          value={selected?.edificio_id || building}
          onChange={(e) => {
            setBuilding(e.target.value);
            setSpace("");
          }}
        >
          <option value="">Selecciona un edificio</option>
          {catalogs?.edificio
            .filter((x) => x.activo)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.clave} · {b.nombre}
              </option>
            ))}
        </Select>
        <Select
          label="Aula o espacio"
          value={space}
          onChange={(e) => setSpace(e.target.value)}
          required
        >
          <option value="">Selecciona un espacio</option>
          {spaces
            .filter(
              (e) =>
                String(e.edificio_id) ===
                String(selected?.edificio_id || building),
            )
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.clave} · {e.nombre}
              </option>
            ))}
        </Select>
      </div>
      {showMap && (
        <details className="map-details" open={mapOpen || undefined}>
          <summary>
            <MapPin size={17} /> Seleccionar en el mapa del campus
          </summary>
          <p className="muted">
            Elige un marcador. Los espacios sin coordenadas están disponibles en
            la lista.
          </p>
          <div className="map-canvas">
            <img
              src={map}
              alt="Mapa de ubicación del Instituto Tecnológico de Toluca"
            />
            {spaces
              .filter((e) => e.mapa_x != null && e.mapa_y != null)
              .map((e) => (
                <button
                  type="button"
                  key={e.id}
                  className={
                    "map-pin " + (selected?.id === e.id ? "selected" : "")
                  }
                  style={{
                    left: Number(e.mapa_x) * 100 + "%",
                    top: Number(e.mapa_y) * 100 + "%",
                  }}
                  aria-label={"Seleccionar " + e.clave}
                  onClick={() => setSpace(String(e.id))}
                >
                  <MapPin size={21} />
                  <span>{e.clave}</span>
                </button>
              ))}
          </div>
        </details>
      )}
    </>
  );
}

export function QRScanner({ onSelect }) {
  const [open, setOpen] = useState(false),
    [manual, setManual] = useState(""),
    [err, setErr] = useState(""),
    video = useRef(null);
  const resolve = useCallback(
    async (value) => {
      try {
        const parsed = value.includes("qr=")
          ? new URL(value).searchParams.get("qr")
          : value;
        const e = await api("/qr/" + encodeURIComponent(parsed));
        onSelect(String(e.id));
        setOpen(false);
        setErr("");
      } catch (e) {
        setErr(e.message);
      }
    },
    [onSelect],
  );
  useEffect(() => {
    if (!open) return;
    let stream,
      stop = false,
      timer;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stop) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        const detector =
          "BarcodeDetector" in window
            ? new window.BarcodeDetector({ formats: ["qr_code"] })
            : null;
        const canvas = document.createElement("canvas"),
          context = canvas.getContext("2d", { willReadFrequently: true });
        const scan = async () => {
          if (stop) return;
          let codes = [];
          if (detector) codes = await detector.detect(video.current);
          else if (video.current.readyState >= 2) {
            canvas.width = video.current.videoWidth;
            canvas.height = video.current.videoHeight;
            context.drawImage(video.current, 0, 0);
            const image = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const decoded = jsQR(image.data, image.width, image.height);
            if (decoded) codes = [{ rawValue: decoded.data }];
          }
          if (codes.length) {
            await resolve(codes[0].rawValue);
            return;
          }
          timer = setTimeout(() => scan().catch((e) => setErr(e.message)), 400);
        };
        await scan();
      } catch (e) {
        setErr(e.message);
      }
    }
    start();
    return () => {
      stop = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, resolve]);
  return (
    <div className="qr-scanner">
      <button type="button" className="button" onClick={() => setOpen(!open)}>
        <ScanLine size={17} />
        {open ? "Cerrar cámara" : "Escanear etiqueta QR"}
      </button>
      {open && (
        <video
          ref={video}
          playsInline
          muted
          aria-label="Cámara para lectura QR"
        />
      )}
      <div className="row">
        <Input
          label="Enlace o código de la etiqueta QR"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Pega el enlace si no usas cámara"
        />
        <button
          type="button"
          className="button"
          onClick={() => resolve(manual)}
        >
          Consultar
        </button>
      </div>
      <ErrorBox message={err} />
    </div>
  );
}

export function PhotoInput({ setPhotos }) {
  const [names, setNames] = useState([]),
    [err, setErr] = useState("");
  return (
    <div>
      <Field
        label="Fotografías opcionales"
        hint="Hasta cinco imágenes JPEG o PNG de 5 MB cada una."
      >
        {(rid) => (
          <input
            id={rid}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={async (e) => {
              try {
                const p = await photosToJSON(e.target.files);
                setPhotos(p);
                setNames([...e.target.files].map((f) => f.name));
                setErr("");
              } catch (er) {
                setErr(er.message);
                setPhotos([]);
                setNames([]);
                e.target.value = "";
              }
            }}
          />
        )}
      </Field>
      {names.length > 0 && (
        <p className="attachment-list">
          <Paperclip size={16} />
          {names.join(" · ")}
        </p>
      )}
      <ErrorBox message={err} />
    </div>
  );
}
