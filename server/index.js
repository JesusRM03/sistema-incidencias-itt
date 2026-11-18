import { app } from "./app.js";
const port = Number(process.env.PORT || 3001);
// La apertura a la red local es explícita y sólo debe usarse en una red privada.
const host = process.env.BIND_HOST || "127.0.0.1";
const server = app.listen(port, host, () => {
  console.log(`API ITT escuchando en ${host}:${server.address().port}`);
  if (host === "0.0.0.0")
    console.log("Demostración LAN: abre APP_ORIGIN en el celular conectado a la misma red.");
});
