let csrf = "";
export function setCSRF(v) {
  csrf = v;
}
export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json();
  if (!response.ok) {
    const e = new Error(data.message || "No se pudo completar la solicitud.");
    e.status = response.status;
    Object.assign(e, data);
    if (response.status === 401 && path !== "/acceso" && path !== "/sesion")
      window.dispatchEvent(new Event("itt-session-expired"));
    throw e;
  }
  if (data.csrf) setCSRF(data.csrf);
  return data;
}
export const post = (path, body = {}, options = {}) =>
  api(path, { method: "POST", body, ...options });
export const patch = (path, body) => api(path, { method: "PATCH", body });
export const date = (v) =>
  v
    ? new Date(v + "Z").toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
export async function photosToJSON(files) {
  if (files.length > 5) throw new Error("Selecciona hasta cinco fotografías.");
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve, reject) => {
          if (
            !["image/png", "image/jpeg"].includes(file.type) ||
            file.size > 5000000
          ) {
            reject(new Error("Cada imagen debe ser JPEG o PNG de hasta 5 MB."));
            return;
          }
          const reader = new FileReader();
          reader.onerror = () =>
            reject(new Error("No se pudo leer la fotografía."));
          reader.onload = () => resolve({ data: reader.result.split(",")[1] });
          reader.readAsDataURL(file);
        }),
    ),
  );
}
