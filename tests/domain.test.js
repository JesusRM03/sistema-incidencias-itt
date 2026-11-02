import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STATES,
  transition,
  text,
  id,
  validateUser,
  password,
  csvCell,
  meanHours,
  sha,
  canonical,
} from "../server/domain.js";
const allowed = new Set([
  "Pendiente|En proceso",
  "Pendiente|Cancelado",
  "En proceso|En revisión",
  "En proceso|Cancelado",
  "En revisión|Resuelto",
  "En revisión|En proceso",
  "Resuelto|Cerrado",
  "Resuelto|En proceso",
]);
for (const from of STATES)
  for (const to of STATES) {
    if (from === to) continue;
    test(`PF-06 ${from} → ${to}`, () => {
      if (allowed.has(from + "|" + to))
        assert.doesNotThrow(() => transition(from, to));
      else assert.throws(() => transition(from, to), { status: 409 });
    });
  }
for (const n of [0, 1, 19, 20, 2000, 2001])
  test(`PF-04 descripción de ${n} caracteres`, () => {
    if (n >= 20 && n <= 2000)
      assert.equal(text("a".repeat(n), 20, 2000), "a".repeat(n));
    else assert.throws(() => text("a".repeat(n), 20, 2000));
  });
for (const v of ["0", "-1", "1 OR 1=1", "1.1", "9007199254740992", "abc"])
  test(`Identificador rechaza ${v}`, () => assert.throws(() => id(v)));
test("Identificador válido", () => assert.equal(id("42"), 42));
const user = {
  nombre: "Ana Martínez",
  correo: "ANA@toluca.tecnm.mx",
  tipo_persona: "Alumno",
  identificador: "23280182",
  rol_id: 1,
};
test("PF-01 alta válida normaliza el correo", () =>
  assert.equal(validateUser(user).correo, "ana@toluca.tecnm.mx"));
for (const value of ["1234567", "123456789", "ABCDEFGH"])
  test("PD-03 rechaza control " + value, () =>
    assert.throws(() => validateUser({ ...user, identificador: value })),
  );
for (const value of [
  "ana@gmail.com",
  "ana@ittoluca.edu.mx",
  "ana@@toluca.tecnm.mx",
])
  test("Correo institucional rechaza " + value, () =>
    assert.throws(() => validateUser({ ...user, correo: value })),
  );
for (const value of [0, 4, 99])
  test("Rol inválido " + value, () =>
    assert.throws(() => validateUser({ ...user, rol_id: value })),
  );
for (const value of [
  "corta",
  "solominusculas123",
  "SOLOMAYUSCULAS123",
  "SinNumerosLargos",
])
  test("Seguridad rechaza contraseña " + value, () =>
    assert.throws(() => password(value)),
  );
test("Contraseña válida", () =>
  assert.equal(password("PruebaITT2026!"), "PruebaITT2026!"));
for (const value of [
  "=1+1",
  "+SUM(A1)",
  "-1",
  "@cmd",
  "\t=1",
  "\r+1",
  "\u0000=1",
])
  test("PF-24 neutraliza fórmula " + JSON.stringify(value), () =>
    assert.equal(csvCell(value)[1], "'"),
  );
test("CSV escapa comillas y separadores", () =>
  assert.equal(csvCell('A,"B"'), '"A,""B"""'));
test("PF-09 media de 2, 4 y 6 horas es 4", () =>
  assert.equal(
    meanHours(
      [2, 4, 6].map((h) => ({
        estado: "Resuelto",
        creada_en: "2026-10-29 00:00:00",
        resuelta_en: `2026-10-29 ${String(h).padStart(2, "0")}:00:00`,
      })),
    ),
    4,
  ));
test("PF-09 sin resoluciones muestra No aplica", () =>
  assert.equal(
    meanHours([
      {
        estado: "Cancelado",
        creada_en: "2026-01-01",
        resuelta_en: "2026-01-02",
      },
    ]),
    null,
  ));
test("RF-22 reabierta no entra en media", () =>
  assert.equal(
    meanHours([
      { estado: "En proceso", creada_en: "2026-01-01", resuelta_en: null },
    ]),
    null,
  ));
test("Tokens se guardan como huella binaria de 32 bytes", () =>
  assert.equal(sha("prueba").length, 32));

test("RF-29 la huella ignora el orden de los campos JSON", () =>
  assert.equal(
    canonical({ b: 2, a: { y: 1, x: 2 } }),
    canonical({ a: { x: 2, y: 1 }, b: 2 }),
  ));
