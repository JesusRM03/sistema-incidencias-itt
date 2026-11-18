import { useState, useEffect, useRef } from "react";
import { MapPin, Camera, ScanLine } from "lucide-react";
import { photosToJSON } from "../api";
import map from "../assets/mapa-itt.jpg";
import jsQR from "jsqr";
import { Field, Input, Select, ErrorBox } from "./ui.jsx";

import { reveal } from "../navigation.js";

function searchable(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function LocationPicker({
  catalogs,
  space,
  setSpace,
  showMap = true,
  mapOpen = false,
  invalidSpace = "",
}) {
  const [building, setBuilding] = useState(""),
    [spaceQuery, setSpaceQuery] = useState(""),
    roomPanel = useRef(null);
  const spaces =
    catalogs?.espacio.filter(
      (e) =>
        catalogs.edificio.some((b) => b.id === e.edificio_id && b.activo) &&
        e.activo,
    ) || [];
  const selected = spaces.find((e) => String(e.id) === String(space));
  const activeId = String(selected?.edificio_id || building);
  const activeBuilding = catalogs?.edificio.find((b) => String(b.id) === activeId);
  const rooms = spaces.filter((r) => String(r.edificio_id) === activeId);
  const pins = new Map();
  for (const building of catalogs?.edificio || []) {
    const room = spaces.find((r) => r.edificio_id === building.id && r.mapa_x != null && r.mapa_y != null);
    if (!room) continue;
    const position = room.mapa_x + "/" + room.mapa_y;
    if (!pins.has(position)) pins.set(position, { room, buildings: [] });
    pins.get(position).buildings.push(building);
  }
  const [shared, setShared] = useState("");
  const query = searchable(spaceQuery.trim());
  const matches = query && mapOpen
    ? spaces.filter((room) => searchable(room.clave + " " + room.nombre).includes(query))
    : [];
  function chooseBuilding(id) {
    setBuilding(String(id));
    setSpace("");
    setShared("");
  }
  return (
    <>
      {catalogs?.demostracion && (
        <p className="muted">Ubicaciones ficticias de la demostración.</p>
      )}
      {mapOpen && (
        <div className="room-search">
          <Input label="Buscar salón" placeholder="Clave o nombre del espacio" value={spaceQuery}
            onChange={(event) => setSpaceQuery(event.target.value)} />
          {query && (
            matches.length ? (
              <ul aria-label="Salones encontrados">
                {matches.map((room) => (
                  <li key={room.id}>
                    <button type="button" className="button" onClick={() => {
                      chooseBuilding(room.edificio_id);
                      setSpace(String(room.id));
                      setSpaceQuery("");
                      requestAnimationFrame(() => reveal(roomPanel.current));
                    }}>{room.clave} · {room.nombre}</button>
                  </li>
                ))}
              </ul>
            ) : <p className="muted" role="status">No encontramos salones con esa búsqueda.</p>
          )}
        </div>
      )}
      <div className="form-grid">
        <Select
          label="Edificio"
          value={selected?.edificio_id || building}
          onChange={(e) => {
            chooseBuilding(e.target.value);
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
          label="Aula o espacio" name="espacio" error={invalidSpace}
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
            Toca la clave de un edificio y elige el salón. Las posiciones de la demo son ilustrativas.
          </p>
          <div className="campus-plan">
            <img src={map} alt="Plano del campus del Tecnológico de Toluca" />
            {[...pins].map(([position, { room, buildings }]) => (
              <button type="button" className="campus-pin" key={position}
                style={{ left: Number(room.mapa_x)*100+"%", top: Number(room.mapa_y)*100+"%" }}
                aria-label={"Elegir edificio " + buildings.map((b) => b.clave+" · "+b.nombre).join(", ")}
                aria-pressed={buildings.some((b) => String(b.id) === activeId)}
                onClick={() => {
                  if (buildings.length === 1) chooseBuilding(buildings[0].id);
                  else { chooseBuilding(""); setShared(position); }
                  requestAnimationFrame(() => reveal(roomPanel.current));
                }}>{buildings.map((b) => b.clave).join(" / ")}</button>
            ))}
          </div>
          <div className="campus-rooms" ref={roomPanel} tabIndex={-1}>
            {shared && pins.get(shared)?.buildings.map((b) => <button type="button" className="button small" key={b.id} onClick={() => chooseBuilding(b.id)}>{b.clave} · {b.nombre}</button>)}
            {activeBuilding && <>
              <h3>{activeBuilding.clave} · {activeBuilding.nombre}</h3>
              <div className="room-list">{rooms.map((r) => <button type="button" className="button small" key={r.id} aria-pressed={String(r.id) === String(space)} onClick={() => setSpace(String(r.id))}>{r.clave} · {r.nombre}</button>)}</div>
            </>}
          </div>
        </details>
      )}
    </>
  );
}

function qrToken(input) {
  const raw = input.trim();
  if (/^[a-f0-9]{64}$/.test(raw)) return raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    /* Accept a token or a full URL. */
  }
  const token = url?.searchParams.get("qr");
  if (url?.origin !== location.origin || !/^[a-f0-9]{64}$/.test(token || ""))
    throw new Error("Etiqueta QR inválida. Usa una etiqueta de este sistema.");
  return token;
}
function decodeFrame(canvas, source, width, height, maxSize) {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height)?.data;
}
export function QRScanner({ onToken }) {
  const [open, setOpen] = useState(false),
    [manual, setManual] = useState(""),
    [err, setErr] = useState(""),
    video = useRef(null);
  function lookup(raw) {
    try {
      onToken(qrToken(raw));
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }
  async function readPhoto(file) {
    if (!file) return;
    setOpen(false);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const data = decodeFrame(
        document.createElement("canvas"),
        img,
        img.naturalWidth,
        img.naturalHeight,
        2000,
      );
      if (!data)
        throw new Error(
          "No se encontró un QR legible. Prueba con otra fotografía.",
        );
      lookup(data);
    } catch (e) {
      setErr(
        e.name === "EncodingError"
          ? "No se pudo abrir la fotografía."
          : e.message,
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  useEffect(() => {
    if (!open) return;
    let stream,
      timer,
      stopped = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Para abrir la cámara, entra mediante HTTPS. También puedes leer una fotografía.",
          );
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const player = video.current;
        player.srcObject = stream;
        await player.play();
        const canvas = document.createElement("canvas");
        function scan() {
          if (stopped) return;
          try {
            if (player.readyState >= 2 && player.videoWidth) {
              const raw = decodeFrame(
                canvas,
                player,
                player.videoWidth,
                player.videoHeight,
                1000,
              );
              if (raw) {
                setOpen(false);
                onToken(qrToken(raw));
                return;
              }
            }
            timer = setTimeout(scan, 300);
          } catch (e) {
            setOpen(false);
            setErr(e.message);
          }
        }
        scan();
      } catch (e) {
        if (stopped) return;
        setOpen(false);
        setErr(
          e.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Permite el acceso o elige una fotografía."
            : e.name === "NotFoundError"
              ? "No se encontró cámara. Puedes cargar una fotografía."
              : e.message,
        );
      }
    }
    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onToken]);
  return (
    <div className="qr-scanner">
      <button
        type="button"
        className="button"
        onClick={() => {
          setErr("");
          setOpen(!open);
        }}
      >
        <ScanLine size={17} />
        {open ? "Cerrar cámara" : "Escanear etiqueta QR"}
      </button>
      {open && (
        <div className="scan-frame"><video
          ref={video}
          playsInline
          muted
          aria-label="Cámara para lectura QR"
        /><span aria-hidden="true" /></div>
      )}
      <label>
        Leer QR desde una fotografía
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files[0];
            e.target.value = "";
            void readPhoto(file);
          }}
        />
      </label>
      <div className="row">
        <Input
          label="Enlace o código de la etiqueta QR"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button
          type="button"
          className="button"
          onClick={() => {
            setOpen(false);
            lookup(manual);
          }}
        >
          Consultar
        </button>
      </div>
      <ErrorBox message={err} />
    </div>
  );
}

export function PhotoInput({ photos, setPhotos, onReading }) {
  const [err, setErr] = useState(""),
    [reading, setReading] = useState(false),
    lock = useRef(false);
  async function add(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length || lock.current) return;
    lock.current = true;
    setReading(true);
    onReading?.(true);
    try {
      if (photos.length + files.length > 5)
        throw new Error(
          "El límite es de cinco fotografías. Quita una para añadir otra.",
        );
      const added = await photosToJSON(files);
      setPhotos([...photos, ...added]);
      setErr("");
    } catch (error) {
      setErr(error.message);
    } finally {
      lock.current = false;
      setReading(false);
      onReading?.(false);
    }
  }
  return (
    <div className="photo-picker">
      <Field
        label="Fotografías opcionales"
        hint="Galería · Hasta cinco imágenes JPEG o PNG de 5 MB cada una."
      >
        {(rid) => (
          <input
            id={rid}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={add}
            disabled={reading}
          />
        )}
      </Field>
      <label className="camera-file">
        <Camera size={17} /> Tomar fotografía
        <input
          aria-label="Tomar fotografía"
          type="file"
          capture="environment"
          accept="image/jpeg,image/png"
          onChange={add}
          disabled={reading}
        />
      </label>
      {reading && <p role="status">Preparando fotografías…</p>}
      {photos.length > 0 && (
        <ul className="photo-previews">
          {photos.map((photo, index) => (
            <li key={index}>
              <img
                src={"data:" + photo.type + ";base64," + photo.data}
                alt={"Vista previa de " + photo.name}
              />
              <span>{photo.name}</span>
              <button
                type="button"
                className="button small"
                disabled={reading}
                aria-label={"Quitar " + photo.name}
                onClick={() => {
                  setPhotos(photos.filter((_, i) => i !== index));
                  setErr("");
                }}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <ErrorBox message={err} />
    </div>
  );
}
