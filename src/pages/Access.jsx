import { useState, useEffect, useCallback } from "react";
import { ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { api, post } from "../api";
import logo from "../assets/logo-itt.png";
import { Input, ErrorBox } from "../components/ui.jsx";

export function Captcha({ purpose, onChange }) {
  const [c, setC] = useState(null),
    [err, setErr] = useState("");
  const refresh = useCallback(() => {
    api("/captcha?proposito=" + encodeURIComponent(purpose))
      .then((d) => {
        setC(d);
        onChange({ captcha_id: d.id, captcha_respuesta: "" });
      })
      .catch((e) => setErr(e.message));
  }, [purpose, onChange]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <div className="captcha">
      <ErrorBox message={err} />
      <div className="row">
        {c && <img src={c.imagen} alt="Código de verificación visual" />}
        <button
          type="button"
          className="icon-button"
          onClick={refresh}
          aria-label="Renovar verificación"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {c?.audio && (
        <audio
          controls
          src={c.audio}
          aria-label="Escuchar código de verificación"
        />
      )}
      <Input
        label="Código de verificación"
        inputMode="numeric"
        autoComplete="off"
        required
        maxLength={5}
        onChange={(e) =>
          onChange({ captcha_id: c?.id, captcha_respuesta: e.target.value })
        }
      />
    </div>
  );
}

export function Login({ onLogin }) {
  const [mode, setMode] = useState("login"),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [needsCaptcha, setNeedsCaptcha] = useState(false),
    [captcha, setCaptcha] = useState({}),
    [success, setSuccess] = useState("");
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "login") {
        const result = await post("/acceso", { ...d, ...captcha });
        onLogin(result.usuario);
      } else {
        await post("/credenciales/canjear", { ...d, ...captcha });
        setSuccess("Contraseña guardada. Ya puedes iniciar sesión.");
        setMode("login");
      }
    } catch (er) {
      setErr(er.message);
      if (er.captcha) setNeedsCaptcha(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <aside className="login-story">
        <div className="brand-mark">
          <img src={logo} alt="Escudo del ITT" />
          <span>
            Tecnológico Nacional de México
            <br />
            <strong>Instituto Tecnológico de Toluca</strong>
          </span>
        </div>
        <div className="story-content">
          <p className="eyebrow">INFRAESTRUCTURA · ITT</p>
          <h1>
            Un campus que
            <br />
            cuidamos entre todos.
          </h1>
          <p>
            Reporta una falla. Consulta su avance.
            <br />
            Ayúdanos a mantener nuestros espacios en buenas condiciones.
          </p>
          <div className="story-rule" />
          <span>REPORTE Y SEGUIMIENTO DE INCIDENCIAS</span>
        </div>
        <small>Comunidad ITT · Metepec, Estado de México</small>
      </aside>
      <main className="login-main">
        <div className="login-form">
          <span className="mini-label">
            <span className="green-dot" /> Portal de infraestructura
          </span>
          <h2>
            {mode === "login"
              ? "Bienvenido de nuevo"
              : "Activa o recupera tu acceso"}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Ingresa con tu cuenta institucional para continuar."
              : "Usa la credencial temporal que te entregó administración. Es válida por 15 minutos y una sola vez."}
          </p>
          <ErrorBox message={err} />
          {success && (
            <p className="notice success" role="status">
              {success}
            </p>
          )}
          <form onSubmit={submit}>
            {mode === "login" ? (
              <>
                <Input
                  label="Correo institucional"
                  name="correo"
                  type="email"
                  autoComplete="username"
                  placeholder="usuario@toluca.tecnm.mx"
                  required
                />
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                {needsCaptcha && (
                  <Captcha purpose="Acceso" onChange={setCaptcha} />
                )}
              </>
            ) : (
              <>
                <Input
                  label="Credencial temporal"
                  name="token"
                  autoComplete="off"
                  required
                />
                <Input
                  label="Nueva contraseña"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  hint="Al menos 12 caracteres, mayúscula, minúscula y número."
                  required
                />
                <Input
                  label="Confirma tu contraseña"
                  name="confirmacion"
                  type="password"
                  autoComplete="new-password"
                  required
                />
                <Captcha purpose="Cambio inicial" onChange={setCaptcha} />
              </>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Procesando…"
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Guardar contraseña"}
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "activate" : "login");
              setErr("");
            }}
          >
            {mode === "login"
              ? "Activar cuenta o recuperar acceso"
              : "Volver a iniciar sesión"}
          </button>
          <p className="login-help">
            <ShieldCheck size={17} /> Las cuentas son autorizadas por
            administración.
            <br />
            Si olvidaste tu contraseña, solicita una credencial temporal.
          </p>
        </div>
        <footer>Instituto Tecnológico de Toluca · Infraestructura</footer>
      </main>
    </div>
  );
}
