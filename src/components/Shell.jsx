import { useState } from "react";
import { Routes, Route, NavLink, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Bell,
  ChartNoAxesColumn,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { post } from "../api";
import logo from "../assets/logo-itt.png";
import { ErrorBox } from "./ui.jsx";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Incidents } from "../pages/Incidents.jsx";
import { NewIncident } from "../pages/NewIncident.jsx";
import { CampusMap } from "../pages/CampusMap.jsx";
import { Detail } from "../pages/Detail.jsx";
import { Notifications } from "../pages/Notifications.jsx";
import { Reports } from "../pages/Reports.jsx";
import { Accounts } from "../pages/Accounts.jsx";
import { Catalogs } from "../pages/Catalogs.jsx";
import { Audit } from "../pages/Audit.jsx";

export function Shell({ user, onLogout }) {
  const [menu, setMenu] = useState(false),
    [logoutError, setLogoutError] = useState("");
  const admin = user.rol_id === 3;
  const links = [
    ["/dashboard", "Resumen", LayoutDashboard],
    [
      "/mis-incidencias",
      user.rol_id === 2 ? "Mi bandeja" : "Incidencias",
      ClipboardList,
    ],
    ["/mapa", "Mapa del campus", MapPin],
    ["/notificaciones", "Notificaciones", Bell],
    ...(admin
      ? [
          ["/reportes", "Reportes", ChartNoAxesColumn],
          ["/administracion", "Usuarios", Users],
          ["/catalogos", "Catálogos y QR", Settings],
          ["/auditoria", "Auditoría", ShieldCheck],
        ]
      : []),
  ];
  async function logout() {
    if (!window.confirm("¿Quieres cerrar tu sesión?")) return;
    try {
      await post("/sesion/cerrar");
      onLogout();
    } catch (e) {
      setLogoutError(e.message);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Link className="brand" to="/dashboard">
          <img src={logo} alt="Escudo ITT" />
          <div>
            <strong>
              ITT<span>Infraestructura</span>
            </strong>
            <small>Gestión de incidencias</small>
          </div>
        </Link>
        <p className="nav-label">ESPACIO DE TRABAJO</p>
        <nav aria-label="Navegación principal">
          {links.map(([url, label, Icon]) => (
            <NavLink key={url} to={url} onClick={() => setMenu(false)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Building2 size={20} />
            <strong>
              Cuidar el campus
              <br />
              empieza con un reporte.
            </strong>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.nombre
                .split(" ")
                .slice(0, 2)
                .map((x) => x[0])
                .join("")}
            </span>
            <div>
              <strong>{user.nombre}</strong>
              <small>{user.rol}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
          <ErrorBox message={logoutError} />
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          onClick={() => setMenu(false)}
          aria-label="Cerrar menú"
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <span>Instituto Tecnológico de Toluca</span>
            <ChevronRight size={14} />
            <strong>Infraestructura</strong>
          </div>
          <span className="top-date">
            {new Date().toLocaleDateString("es-MX", {
              timeZone: "America/Mexico_City",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </header>
        <main id="contenido" className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route
              path="/mis-incidencias"
              element={<Incidents user={user} />}
            />
            <Route path="/nueva-incidencia" element={<NewIncident />} />
            <Route path="/incidencias/:id" element={<Detail user={user} />} />
            <Route path="/mapa" element={<CampusMap />} />
            <Route path="/notificaciones" element={<Notifications />} />
            <Route
              path="/reportes"
              element={admin ? <Reports /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/administracion"
              element={admin ? <Accounts /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/catalogos"
              element={admin ? <Catalogs /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/auditoria"
              element={admin ? <Audit /> : <Navigate to="/dashboard" />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <footer className="page-footer">
            <span>ITT · Gestión de infraestructura</span>
            <span>Fechas en horario del centro de México</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
