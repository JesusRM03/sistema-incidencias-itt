import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import Administracion from './pages/Administracion'
import Dashboard from './pages/Dashboard'
import DetalleIncidencia from './pages/DetalleIncidencia'
import Login from './pages/Login'
import MisIncidencias from './pages/MisIncidencias'
import Notificaciones from './pages/Notificaciones'
import NuevaIncidencia from './pages/NuevaIncidencia'
import Register from './pages/Register'
import Reportes from './pages/Reportes'
import { ROLES } from './utils/storage'

function RutaPrivada({ children }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RutaPorRol({ roles, children }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function LayoutPrivado({ children }) {
  return (
    <RutaPrivada>
      <div className="min-h-screen bg-slate-950 text-white lg:flex">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </RutaPrivada>
  )
}

function AppRoutes() {
  const rolesReportantes = [ROLES.ALUMNO, ROLES.DOCENTE]
  const rolesAdmin = [ROLES.ADMINISTRADOR]

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <LayoutPrivado>
              <Dashboard />
            </LayoutPrivado>
          }
        />

        <Route
          path="/nueva-incidencia"
          element={
            <LayoutPrivado>
              <RutaPorRol roles={rolesReportantes}>
                <NuevaIncidencia />
              </RutaPorRol>
            </LayoutPrivado>
          }
        />

        <Route
          path="/mis-incidencias"
          element={
            <LayoutPrivado>
              <MisIncidencias />
            </LayoutPrivado>
          }
        />

        <Route
          path="/incidencias/:id"
          element={
            <LayoutPrivado>
              <DetalleIncidencia />
            </LayoutPrivado>
          }
        />

        <Route
          path="/notificaciones"
          element={
            <LayoutPrivado>
              <Notificaciones />
            </LayoutPrivado>
          }
        />

        <Route
          path="/reportes"
          element={
            <LayoutPrivado>
              <RutaPorRol roles={rolesAdmin}>
                <Reportes />
              </RutaPorRol>
            </LayoutPrivado>
          }
        />

        <Route
          path="/administracion"
          element={
            <LayoutPrivado>
              <RutaPorRol roles={rolesAdmin}>
                <Administracion />
              </RutaPorRol>
            </LayoutPrivado>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
