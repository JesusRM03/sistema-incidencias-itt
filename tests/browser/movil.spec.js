import { test, expect, devices, chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import jsQR from "jsqr";
import { unzipSync } from "fflate";

const origin = () => process.env.APP_ORIGIN;
const mobile = { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } };
async function login(page, name, route = "/") {
  await page.goto(route);
  await page
    .getByLabel("Correo institucional", { exact: true })
    .fill(name + "@toluca.tecnm.mx");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env["DEMO_PASSWORD_" + name.toUpperCase()]);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(
    page.getByLabel("Correo institucional", { exact: true }),
  ).toHaveCount(0);
}
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function menu(page, target) {
  await button(page, "Abrir menú").click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: target, exact: true })
    .click();
}
async function selectType(page, type) {
  const waiting = page.waitForResponse(
    (r) =>
      r.url().includes("/coincidencias?") &&
      r.url().includes("tipo_falla_id=" + type),
  );
  await page.getByLabel("Tipo de falla", { exact: true }).selectOption(type);
  if ((await (await waiting).json()).length)
    await page
      .getByLabel("¿Qué hace diferente este reporte?")
      .fill("La comprobación corresponde a otro equipo de prueba.");
}
async function filePNG() {
  return sharp({
    create: { width: 48, height: 48, channels: 3, background: "#448855" },
  })
    .png()
    .toBuffer();
}
async function decodedPNG(bytes) {
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}
async function labelFor(page, id) {
  const { csrf } = await (await page.request.get("/api/sesion")).json();
  const r = await page.request.post("/api/espacios/" + id + "/qr", {
    data: {},
    headers: { Origin: origin(), "X-CSRF-Token": csrf },
  });
  expect(r.status()).toBe(200);
  return r.json();
}
test("Flujo móvil HTTPS desde QR hasta cierre, historial, aviso y descarga CSV", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const contexts = await Promise.all(
    [0, 1, 2].map(() => browser.newContext({ ...mobile, baseURL: origin() })),
  );
  const [admin, alumno, tecnico] = await Promise.all(
    contexts.map((c) => c.newPage()),
  );
  try {
    await login(admin, "admin");
    const label = await labelFor(admin, 1);
    await login(alumno, "alumno", label.url);
    await expect(
      alumno
        .getByText(label.clave + " · " + label.nombre, { exact: true })
        .first(),
    ).toBeVisible();
    await button(alumno, "Usar este salón").click();
    const cookies = await contexts[1].cookies();
    const session = cookies.find((c) => c.name === "itt_session");
    expect(
      session.httpOnly && session.secure && session.sameSite === "Strict",
    ).toBeTruthy();
    await expect(alumno.getByLabel("Aula o espacio")).toHaveValue("1");
    await selectType(alumno, "1");
    await alumno
      .getByLabel("Descripción", { exact: true })
      .fill("Prueba de proyector desde la vista móvil y galería.");
    const image = await filePNG();
    const upload = { name: "equipo.png", mimeType: "image/png", buffer: image };
    await alumno
      .getByLabel("Fotografías opcionales", { exact: true })
      .setInputFiles(upload);
    await expect(button(alumno, "Quitar equipo.png")).toBeVisible();
    await alumno
      .getByLabel("Tomar fotografía", { exact: true })
      .setInputFiles({ ...upload, name: "captura.png" });
    await button(alumno, "Quitar equipo.png").click();
    await alumno.getByRole("link", { name: "Guardar y salir" }).click();
    await alumno.goto("/nueva-incidencia");
    await expect(alumno.getByLabel("Descripción", { exact: true })).toHaveValue(
      /desde la vista móvil/,
    );
    await expect(button(alumno, "Quitar captura.png")).toBeVisible();
    await expect(alumno.getByText(/Borrador guardado en esta pestaña/)).toBeVisible();
    // Drop only the response after the real API has committed the report.
    await alumno.route(
      "**/api/incidencias",
      async (route) => {
        const response = await route.fetch();
        expect(response.status()).toBe(201);
        await route.abort("failed");
      },
      { times: 1 },
    );
    await button(alumno, "Registrar incidencia").click();
    await expect(button(alumno, "Reintentar envío")).toBeVisible();
    await expect(alumno.getByText(/Falta confirmar el registro/)).toBeVisible();
    await alumno.reload();
    await button(alumno, "Reintentar envío").click();
    await expect(
      alumno.getByText(/Incidencia registrada. Folio ITT-/),
    ).toBeVisible();
    const detail = new URL(alumno.url()).pathname,
      folio = await alumno.locator(".page-head .eyebrow").innerText();
    const evidence = alumno.getByRole("img", { name: /Evidencia fotográfica/ });
    await expect(evidence).toHaveCount(1);
    expect(
      await (
        await alumno.request.get(await evidence.getAttribute("src"))
      ).body(),
    ).toEqual(image);
    await fs.mkdir("artifacts", { recursive: true });
    await fs.writeFile(
      "artifacts/flujo-movil.json",
      JSON.stringify({ detalle: detail, folio }),
    );
    await admin.goto(detail);
    await button(admin, "Asignar").click();
    await expect(admin.locator("#asignar")).toBeFocused();
    await expect(admin.getByRole("heading", {name:"Cancelar o vincular duplicado"})).toBeHidden();
    await admin.getByLabel("Prioridad", { exact: true }).selectOption("Alta");
    await admin
      .getByLabel("Motivo de la clasificación o cambio")
      .fill("Prioridad para la práctica.");
    await button(admin, "Guardar clasificación").click();
    await expect(admin.locator(".detail-summary .priority")).toHaveText("Alta");
    await admin
      .getByLabel("Técnico responsable", { exact: true })
      .selectOption({ label: "Técnico demo" });
    await admin
      .getByLabel("Motivo de asignación")
      .fill("Revisar el proyector reportado.");
    await button(admin, "Confirmar asignación").click();
    await expect(admin.locator(".page-head .badge")).toHaveText("En proceso");
    await expect(admin.getByRole("status").filter({hasText:"Incidencia asignada a Técnico demo."})).toBeVisible();
    await login(tecnico, "tecnico", detail);
    const visibility = tecnico.getByLabel("Visibilidad");
    await visibility.selectOption("Interna");
    await expect(visibility).toHaveAccessibleDescription("Visible para administración y el técnico con asignación vigente.");
    await visibility.selectOption("Pública");
    await expect(visibility).toHaveAccessibleDescription("También podrá leerla la persona que reportó la falla.");
    for (const [kind, content] of [
      ["Diagnóstico", "Se revisó la alimentación."],
      ["Avance", "Se probó el componente."],
      ["Solución", "Se concluyó la reparación y la prueba."],
    ]) {
      await tecnico.getByLabel("Tipo de intervención").selectOption(kind);
      await tecnico.getByLabel("Detalle de la intervención").fill(content);
      if (kind === "Diagnóstico") {
        await tecnico
          .getByLabel("Fotografías opcionales", { exact: true })
          .setInputFiles(upload);
        await expect(button(tecnico, "Quitar equipo.png")).toBeVisible();
      }
      await button(tecnico, "Guardar intervención").click();
      await expect(
        tecnico.locator(".timeline").getByText(content, { exact: true }),
      ).toBeVisible();
    }
    await tecnico.getByRole("button", {name:"Ampliar fotografía 1 · Reporte inicial"}).click();
    const gallery = tecnico.getByRole("dialog", {name:"Galería de evidencias"});
    await expect(gallery).toContainText("1 de 2 · Reporte inicial");
    await gallery.getByRole("button", {name:"Siguiente"}).click();
    await expect(gallery).toContainText("2 de 2 · Diagnóstico");
    await tecnico.keyboard.press("Escape");
    await expect(gallery).toBeHidden();
    await admin.reload();
    const review = admin.locator("#revisar");
    await expect(review.getByRole("heading", {name:"Reporte inicial"})).toBeVisible();
    await review.getByRole("button", {name:"Solución", exact:true}).click();
    await expect(review.getByText("Se concluyó la reparación y la prueba.")).toBeVisible();
    await expect(review.getByRole("heading", {name:"Fotografías del diagnóstico"})).toBeVisible();
    await expect(review.getByRole("button", {name:"Ampliar fotografía 1 · Diagnóstico"})).toBeVisible();
    await admin
      .getByLabel("Motivo o verificación")
      .fill("Se comprobó el diagnóstico y la reparación.");
    admin.once("dialog", (d) => d.accept());
    await button(admin, "Confirmar acción").click();
    await expect(admin.locator(".page-head .badge")).toHaveText("Resuelto");
    await alumno.reload();
    await alumno
      .getByLabel("Motivo o verificación")
      .fill("Se verificó el funcionamiento del proyector.");
    alumno.once("dialog", (d) => d.accept());
    await button(alumno, "Confirmar acción").click();
    await expect(alumno.locator(".page-head .badge")).toHaveText("Cerrado");
    await expect(
      alumno.locator(".timeline").getByText(/Confirmó el cierre/),
    ).toBeVisible();
    await menu(alumno, "Notificaciones");
    const notice = alumno
      .locator("article.notification")
      .filter({ hasText: folio })
      .first();
    await notice.getByRole("button", { name: "Marcar como leída" }).click();
    await expect(notice.getByText("Leída", { exact: true })).toBeVisible();
    const noticeLink = notice.getByRole("link");
    const eventHash = (await noticeLink.getAttribute("href")).split("#")[1];
    expect(eventHash).toMatch(/^evento-\d+$/);
    await noticeLink.click();
    const event = alumno.locator("#" + eventHash);
    await expect(event).toHaveAttribute("aria-current", "location");
    await expect(event).toBeFocused();
    await expect(button(alumno, "Copiar folio")).toBeVisible();
    await menu(admin, "Reportes");
    await admin.getByLabel("Buscar", { exact: true }).fill(folio);
    await expect(admin.locator("tbody tr")).toHaveCount(1);
    const download = admin.waitForEvent("download");
    await admin.getByRole("link", { name: "Exportar CSV" }).click();
    const csv = await fs.readFile(await (await download).path(), "utf8");
    expect(csv).toContain(folio);
    expect(csv.trim().split("\r\n")).toHaveLength(2);
    await button(alumno, "Abrir menú").click();
    const cerrarSesion = button(alumno, "Cerrar sesión");
    await expect(cerrarSesion).toHaveText("Cerrar sesión");
    await expect(cerrarSesion).toBeInViewport({ ratio: 1 });
    alumno.once("dialog", (d) => d.accept());
    await cerrarSesion.click();
    await expect(
      alumno.getByLabel("Correo institucional", { exact: true }),
    ).toBeVisible();
    expect((await alumno.request.get("/api/sesion")).status()).toBe(401);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("Etiquetas impresas y ZIP legibles, lectura de foto y error recuperable de cámara", async ({
  page,
  browser,
}) => {
  await login(page, "admin");
  await page.goto("/catalogos");
  await page.getByRole("tab", { name: "Espacios", exact: true }).click();
  await button(page, "Preparar todas las etiquetas").click();
  const links = page.getByRole("link", { name: "Descargar PNG", exact: true });
  await expect(links.first()).toBeVisible();
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(12);
  const download = page.waitForEvent("download");
  await button(page, "Descargar lote ZIP").click();
  const zip = unzipSync(await fs.readFile(await (await download).path()));
  expect(Object.keys(zip)).toHaveLength(count);
  const png = Object.values(zip)[0],
    url = await decodedPNG(png);
  expect(new URL(url).origin).toBe(origin());
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printCount = document.querySelectorAll(
        ".qr-print-sheet img",
      ).length;
    };
  });
  await button(page, "Imprimir etiquetas").click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-print-count",
    String(count),
  );
  const phone = await browser.newContext({ ...mobile, baseURL: origin() });
  try {
    const p = await phone.newPage();
    await login(p, "alumno", "/nueva-incidencia");
    await p.getByText("Identificar espacio por QR", { exact: true }).click();
    await p
      .getByLabel("Enlace o código de la etiqueta QR")
      .fill("etiqueta inválida");
    await button(p, "Consultar").click();
    await expect(p.getByText(/Etiqueta QR inválida/)).toBeVisible();
    await button(p, "Escanear etiqueta QR").click();
    await expect(p.getByRole("alert").last()).toContainText(
      /cámara|device|permiso/i,
    );
    await p
      .getByLabel("Leer QR desde una fotografía")
      .setInputFiles({
        name: "etiqueta.png",
        mimeType: "image/png",
        buffer: Buffer.from(png),
      });
    await expect(p).toHaveURL(url);
    await button(p, "Usar este salón").click();
    await expect(p.getByLabel("Aula o espacio")).not.toHaveValue("");
  } finally {
    await phone.close();
  }
});

test("Lector en vivo con una cámara virtual que muestra la etiqueta emitida", async ({
  page,
}, testInfo) => {
  await login(page, "admin");
  const label = await labelFor(page, 2);
  const side = 480;
  const y = await sharp(Buffer.from(label.imagen.split(",")[1], "base64"))
    .resize(side, side)
    .greyscale()
    .raw()
    .toBuffer();
  const frame = Buffer.concat([
    Buffer.from("FRAME\n"),
    y,
    Buffer.alloc((side * side) / 2, 128),
  ]);
  const file = testInfo.outputPath("camara.y4m");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(
    file,
    Buffer.concat([
      Buffer.from("YUV4MPEG2 W480 H480 F5:1 Ip A1:1 C420jpeg\n"),
      frame,
      frame,
    ]),
  );
  const camera = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "--use-file-for-fake-video-capture=" + file,
    ],
  });
  try {
    const phone = await camera.newContext({
        ...mobile,
        baseURL: origin(),
        permissions: ["camera"],
      }),
      p = await phone.newPage();
    await login(p, "alumno", "/nueva-incidencia");
    await p.getByText("Identificar espacio por QR", { exact: true }).click();
    await button(p, "Escanear etiqueta QR").click();
    await expect(button(p, "Usar este salón")).toBeVisible({
      timeout: 15000,
    });
    await button(p, "Usar este salón").click();
    await expect(p.getByLabel("Aula o espacio")).toHaveValue("2");
  } finally {
    await camera.close();
  }
});

test("Mapa con salones superpuestos, menú por teclado y borrador al volver de una desconexión", async ({
  browser,
}) => {
  const context = await browser.newContext({ ...mobile, baseURL: origin() });
  try {
    const page = await context.newPage();
    await login(page, "alumno");
    await button(page, "Abrir menú").press("Enter");
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(button(page, "Abrir menú")).toBeFocused();
    const theme = page.getByLabel("Tema de la página");
    await theme.selectOption("oscuro");
    await page.reload();
    await expect(theme).toHaveValue("oscuro");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "oscuro");
    await theme.selectOption("bosque");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "bosque");
    await theme.selectOption("normal");
    await menu(page, "Mapa del campus");
    await page.getByRole("textbox", {name:"Buscar salón"}).fill("computo 2");
    await page.getByRole("list", {name:"Salones encontrados"}).getByRole("button", {name:/T-02/}).click();
    await expect(page.getByRole("button", {name:/Elegir edificio T ·/})).toHaveAttribute("aria-pressed","true");
    await expect(page.getByRole("link", {name:"Reportar en T-02"})).toBeVisible();
    await page
      .getByRole("button", { name: /Elegir edificio T ·/ })
      .click();
    await button(page, "T-02 · Laboratorio de cómputo 2").click();
    await page.getByRole("link", { name: "Reportar en T-02" }).click();
    await expect(page.getByLabel("Aula o espacio")).toHaveValue("2");
    await page
      .getByLabel("Descripción", { exact: true })
      .fill("El borrador sobrevive a una interrupción de Wi-Fi.");
    await context.setOffline(true);
    await expect(page.getByText(/Sin conexión. Podrás/)).toBeVisible();
    await context.setOffline(false);
    await page.reload();
    await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue(
      /sobrevive/,
    );
    const inputs = page.getByLabel("Fotografías opcionales", { exact: true }),
      source = await filePNG();
    const photos = Array.from({ length: 5 }, (_, i) => ({
      name: "foto-" + i + ".png",
      mimeType: "image/png",
      buffer: source,
    }));
    await inputs.setInputFiles(photos);
    await expect(page.locator(".photo-previews img")).toHaveCount(5);
    await inputs.setInputFiles(photos[0]);
    await expect(page.getByText(/El límite es de cinco/)).toBeVisible();
    await expect(page.locator(".photo-previews img")).toHaveCount(5);
    await page.goto("/administracion");
    await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible();
    await button(page, "Abrir menú").click();
    page.once("dialog", (d) => d.accept());
    await button(page, "Cerrar sesión").click();
    await login(page, "otro", "/nueva-incidencia");
    await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue(
      "",
    );
    await expect(page.locator(".photo-previews img")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("Inicio por rol, tarjeta móvil, filtros y regreso a la posición anterior", async ({page}) => {
  await page.setViewportSize({width:360,height:720});
  await login(page,"admin");
  await page.getByRole("link",{name:/Pendientes de asignar/}).click();
  await expect(page.getByLabel("Estado",{exact:true})).toHaveValue("Pendiente");
  const filtersButton = page.getByRole("button", {name:/Buscar y filtrar/});
  await filtersButton.click();
  await expect(page.getByLabel("Estado",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:/Ocultar filtros/}).click();
  const card = page.locator(".incident-card").last();
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await card.click();
  await expect(page.getByRole("button",{name:"Copiar folio"})).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Estado",{exact:true})).toHaveValue("Pendiente");
  await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(5);
});

test("Atajo de escaneo y guía al primer campo pendiente", async ({page}) => {
  await login(page,"alumno");
  await page.getByRole("link",{name:"Escanear QR"}).click();
  await expect(button(page,"Escanear etiqueta QR")).toBeVisible();
  await page.getByLabel("Edificio",{exact:true}).selectOption("1");
  await page.getByLabel("Aula o espacio").selectOption("1");
  await button(page,"Registrar incidencia").click();
  await expect(page.getByLabel("Tipo de falla",{exact:true})).toBeFocused();
  await expect(page.getByRole("alert")).toContainText("Elige el tipo de falla.");
});

test("Técnico puede cambiar el orden de su bandeja", async ({page}) => {
  await login(page,"tecnico","/mis-incidencias");
  const sort = page.getByLabel("Ordenar incidencias");
  await sort.selectOption("prioridad");
  await expect(page).toHaveURL(/orden=prioridad/);
  await sort.selectOption("antigua");
  await expect(page).toHaveURL(/orden=antigua/);
  await page.reload();
  await expect(sort).toHaveValue("antigua");
});
