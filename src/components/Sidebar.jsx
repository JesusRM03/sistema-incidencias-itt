import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Home,
  LogOut,
  PlusCircle,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition'

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 p-5 text-white">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950">
            <AlertTriangle size={26} />
          </div>

          <div>
            <h1 className="text-lg font-bold leading-tight">
              Incidencias ITT
            </h1>
            <p className="text-xs text-slate-400">Prototipo académico</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-semibold">{usuario?.nombre}</p>
        <p className="text-xs text-slate-400">{usuario?.rol}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-900'
            }`
          }
        >
          <Home size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/nueva-incidencia"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-900'
            }`
          }
        >
          <PlusCircle size={18} />
          Nueva incidencia
        </NavLink>

        <NavLink
          to="/mis-incidencias"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-900'
            }`
          }
        >
          <ClipboardList size={18} />
          Incidencias
        </NavLink>

        <NavLink
          to="/reportes"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-900'
            }`
          }
        >
          <BarChart3 size={18} />
          Reportes
        </NavLink>
      </nav>

      <button
        onClick={cerrarSesion}
        className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  )
}