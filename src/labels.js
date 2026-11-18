function lines(ctx, text, width) {
  const result = [];
  let row = "";
  for (const word of text.split(/\s+/)) {
    const next = row ? row + " " + word : word;
    if (row && ctx.measureText(next).width > width) {
      result.push(row);
      row = "";
    }
    if (ctx.measureText(word).width > width) {
      for (const char of word) {
        if (ctx.measureText(row + char).width > width) {
          result.push(row);
          row = "";
        }
        row += char;
      }
    } else row = row ? row + " " + word : word;
  }
  return [...result, row];
}
// Render exactly the same printable artwork for individual PNGs and the batch ZIP.
export async function labelArtwork(label) {
  const qr = new Image();
  qr.src = label.imagen;
  await qr.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  const ctx = canvas.getContext("2d");
  ctx.font = "bold 30px Arial";
  const title = lines(ctx, label.clave + " · " + label.nombre, 580);
  ctx.font = "24px Arial";
  const building = lines(
    ctx,
    label.edificio_clave + " · " + label.edificio,
    580,
  );
  canvas.height = 610 + title.length * 38 + building.length * 30;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#142d53";
  ctx.font = "bold 21px Arial";
  ctx.fillText(
    label.demostracion
      ? "ITT · DEMOSTRACIÓN ACADÉMICA"
      : "ITT · REPORTE DE INCIDENCIAS",
    320,
    40,
  );
  let y = 88;
  ctx.font = "bold 30px Arial";
  for (const row of title) {
    ctx.fillText(row, 320, y);
    y += 38;
  }
  ctx.font = "24px Arial";
  for (const row of building) {
    ctx.fillText(row, 320, y);
    y += 30;
  }
  ctx.drawImage(qr, 80, y, 480, 480);
  ctx.font = "20px Arial";
  ctx.fillText(
    "Escanea para reportar · Versión " + label.version,
    320,
    y + 504,
  );
  return {
    ...label,
    png: canvas.toDataURL("image/png"),
    filename:
      "ITT-" +
      label.id +
      "-" +
      label.clave.replace(/[^\p{L}\p{N}_-]/gu, "_") +
      ".png",
  };
}
export async function downloadBatch(labels) {
  const { zipSync } = await import("fflate");
  const files = Object.fromEntries(
    labels.map((label) => [
      label.filename,
      Uint8Array.from(atob(label.png.split(",")[1]), (c) => c.charCodeAt(0)),
    ]),
  );
  const url = URL.createObjectURL(
    new Blob([zipSync(files, { level: 0 })], { type: "application/zip" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "etiquetas-ITT.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
