import "./modern.css";
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { api } from "./api";
import { ErrorBox, Loading } from "./components/ui.jsx";
import { Login } from "./pages/Access.jsx";
import { Shell } from "./components/Shell.jsx";

function Root() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("qr")) sessionStorage.setItem("itt_qr", params.get("qr"));
    api("/sesion")
      .then((d) => setUser(d.usuario))
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      })
      .finally(() => setReady(true));
    const expire = () => setUser(null);
    window.addEventListener("itt-session-expired", expire);
    return () => window.removeEventListener("itt-session-expired", expire);
  }, []);
  if (!ready) return <Loading error={error} />;
  return user ? (
    <Shell user={user} onLogout={() => setUser(null)} />
  ) : (
    <>
      <ErrorBox message={error} />
      <Login onLogin={setUser} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}
