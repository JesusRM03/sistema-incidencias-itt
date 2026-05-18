import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import MisIncidencias from './pages/MisIncidencias'
import NuevaIncidencia from './pages/NuevaIncidencia'
import Register from './pages/Register'
import Reportes from './pages/Reportes'

function RutaPrivada({ children }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return children
}

function LayoutPrivado({ children }) {
  return (
    <RutaPrivada>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </RutaPrivada>
  )
}

function AppRoutes() {
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
              <NuevaIncidencia />
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
          path="/reportes"
          element={
            <LayoutPrivado>
              <Reportes />
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