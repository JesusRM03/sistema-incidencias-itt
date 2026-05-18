import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  LogOut,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoITT from '../assets/logo-itt.png'
import { useAuth } from '../context/AuthContext'
import { getNotificaciones, ROLES } from '../utils/storage'

const linkBase =
  'flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition'

const enlaces = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icono: Home,
  },
  {
    to: '/nueva-incidencia',
    label: 'Nueva incidencia',
    icono: PlusCircle,
    roles: [ROLES.ALUMNO, ROLES.DOCENTE],
  },
  {
    to: '/mis-incidencias',
    label: 'Incidencias',
    icono: ClipboardList,
  },
  {
    to: '/notificaciones',
    label: 'Notificaciones',
    icono: Bell,
    contador: true,
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icono: BarChart3,
    roles: [ROLES.ADMINISTRADOR],
  },
  {
    to: '/administracion',
    label: 'Administración',
    icono: ShieldCheck,
    roles: [ROLES.ADMINISTRADOR],
  },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [noLeidas, setNoLeidas] = useState(() => contarNoLeidas(usuario?.correo))

  useEffect(() => {
    const actualizarContador = () => {
      setNoLeidas(contarNoLeidas(usuario?.correo))
    }

    window.addEventListener('itt-storage-updated', actualizarContador)
    return () => window.removeEventListener('itt-storage-updated', actualizarContador)
  }, [usuario?.correo])

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  const enlacesVisibles = enlaces.filter(
    (enlace) => !enlace.roles || enlace.roles.includes(usuario?.rol),
  )

  return (
    <aside className="border-b border-slate-800 bg-slate-950/95 p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md">
            <img
              src={logoITT}
              alt="Logo Instituto Tecnológico de Toluca"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">Incidencias ITT</h1>
            <p className="text-xs text-slate-400">Prototipo académico</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30">
          <p className="truncate text-sm font-semibold">{usuario?.nombre}</p>
          <p className="mt-1 text-xs font-medium text-emerald-300">{usuario?.rol}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{usuario?.correo}</p>
        </div>
      </div>

      <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-col">
        {enlacesVisibles.map((enlace) => {
          const Icono = enlace.icono

          return (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icono size={18} />
                <span className="truncate">{enlace.label}</span>
              </span>

              {enlace.contador && noLeidas > 0 && (
                <span className="rounded-full bg-orange-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                  {noLeidas}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={cerrarSesion}
        className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-950/70 lg:mt-6"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  )
}

function contarNoLeidas(correo) {
  if (!correo) return 0

  return getNotificaciones().filter(
    (notificacion) =>
      notificacion.destinatarioCorreo === correo && !notificacion.leida,
  ).length
}
