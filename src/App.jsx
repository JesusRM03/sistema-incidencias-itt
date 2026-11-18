import "./modern.css";
import { useState, useEffect, useSyncExternalStore } from "react";
import { BrowserRouter } from "react-router-dom";
import { api } from "./api";
import { ErrorBox, Loading } from "./components/ui.jsx";
import { Login } from "./pages/Access.jsx";
import { Shell } from "./components/Shell.jsx";

function subscribeNetwork(change) {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => {
    window.removeEventListener("online", change);
    window.removeEventListener("offline", change);
  };
}
function Root() {
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine);
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
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
  return (
    <>
      {!online && (
        <p className="network-banner" role="status">
          Sin conexión. Podrás enviar los cambios cuando regrese la red.
        </p>
      )}
      {user ? (
        <Shell user={user} onLogout={() => setUser(null)} />
      ) : (
        <>
          <ErrorBox message={error} />
          <Login
            onLogin={(profile) => {
              setError("");
              setUser(profile);
            }}
          />
        </>
      )}
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
