import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import sharp from "sharp";
const routes = [
  ["dashboard", "resumen"],
  ["mis-incidencias", "incidencias"],
  ["nueva-incidencia", "registro"],
  ["mapa", "mapa"],
  ["notificaciones", "avisos"],
  ["reportes", "reportes"],
  ["administracion", "usuarios"],
  ["catalogos", "catalogos"],
  ["auditoria", "auditoria"],
];
async function login(page, name = "admin") {
  await page.goto("/");
  await page
    .getByLabel("Correo institucional", { exact: true })
    .fill(name + "@toluca.tecnm.mx");
  await page.getByLabel("Contraseña", { exact: true }).fill("PruebaITT2026!");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: name === "admin" ? "Panorama del campus" : /Hola/,
    }),
  ).toBeVisible();
}
test("Pantallas administrativas sin errores de JavaScript", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: "artifacts/screens/login.png" });
  await login(page);
  for (const [route, name] of routes) {
    await page.goto("/" + route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText("Cargando información…")).toHaveCount(0);
    await page.screenshot({
      path: "artifacts/screens/" + name + ".png",
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
for (const width of [360, 768, 1366])
  test("Interfaz adaptable a " + width + " px", async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    for (const route of [
      "dashboard",
      "mis-incidencias",
      "nueva-incidencia",
      "catalogos",
    ]) {
      await page.goto("/" + route);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.getByText("Cargando información…")).toHaveCount(0);
      await page.screenshot({
        path: `artifacts/screens/debug-${route}-${width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: `artifacts/screens/${route}-${width}.png`,
        fullPage: true,
      });
    }
  });
test("Formulario registra y muestra el folio con evidencia", async ({
  page,
}) => {
  await login(page, "alumno");
  await page.goto("/nueva-incidencia");
  await page.getByLabel("Edificio", { exact: true }).selectOption("1");
  await page.getByLabel("Aula o espacio", { exact: true }).selectOption("3");
  await page.getByLabel("Tipo de falla", { exact: true }).selectOption("5");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("La conexión de red falla en este laboratorio durante las clases.");
  await page
    .getByLabel("Fotografías opcionales", { exact: true })
    .setInputFiles({
      name: "evidencia.png",
      mimeType: "image/png",
      buffer: await sharp({
        create: { width: 30, height: 30, channels: 3, background: "#426a47" },
      })
        .png()
        .toBuffer(),
    });
  await page
    .getByRole("button", { name: "Registrar incidencia", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Red o conectividad", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Descripción del reporte", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/screens/detalle-reportante.png",
    fullPage: true,
  });
  await fs.writeFile(
    "artifacts/ui-created.json",
    JSON.stringify({ url: page.url() }),
  );
});
test("Panel técnico y validación administrativa muestran acciones por rol", async ({
  page,
}) => {
  await login(page, "tecnico");
  await page.goto("/incidencias/2");
  await expect(
    page.getByRole("heading", { name: "Registrar intervención" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Revisión y prioridad" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "artifacts/screens/detalle-tecnico.png",
    fullPage: true,
  });
  await page.context().clearCookies();
  await login(page);
  await page.goto("/incidencias/3");
  await expect(
    page.getByRole("heading", { name: "Validar solución técnica" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/screens/revision-admin.png",
    fullPage: true,
  });
  await page.goto("/incidencias/4");
  await page.screenshot({
    path: "artifacts/screens/cierre-admin.png",
    fullPage: true,
  });
});
test("Reportante confirma cierre y no ve administración", async ({ page }) => {
  await login(page, "alumno");
  await page.goto("/incidencias/4");
  await expect(
    page.getByRole("heading", { name: "¿La falla quedó solucionada?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/screens/cierre-reportante.png",
    fullPage: true,
  });
  await page.goto("/administracion");
  await expect(page.getByRole("heading", { name: /Hola/ })).toBeVisible();
});

test("Accesibilidad de acceso, registro y consulta", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const reports = [];
  await page.goto("/");
  reports.push({
    screen: "acceso",
    ...(await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()),
  });
  await login(page);
  for (const route of ["dashboard", "nueva-incidencia", "mis-incidencias"]) {
    await page.goto("/" + route);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText("Cargando información…")).toHaveCount(0);
    reports.push({
      screen: route,
      ...(await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()),
    });
  }
  await fs.writeFile(
    "artifacts/accessibility-results.json",
    JSON.stringify(reports, null, 2),
  );
  expect(
    reports.flatMap((r) =>
      r.violations.map((v) => ({
        screen: r.screen,
        id: v.id,
        examples: v.nodes
          .slice(0, 3)
          .map((n) => ({ html: n.html, summary: n.failureSummary })),
      })),
    ),
  ).toEqual([]);
});
