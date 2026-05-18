import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  LogOut,
  Map,
  Palette,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logoITT from '../assets/logo-itt.png'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getNotificaciones, ROLES } from '../utils/storage'

const linkBase =
  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition'

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
    to: '/mapa',
    label: 'Mapa ITT',
    icono: Map,
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
  const { theme, themes, setThemeId } = useTheme()
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
    <aside className="theme-sidebar border-b p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
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
            <p className="theme-muted text-xs">Prototipo académico</p>
          </div>
        </div>

        <div className="theme-card-soft rounded-2xl border p-4">
          <p className="truncate text-sm font-semibold">{usuario?.nombre}</p>
          <p className="theme-accent-text mt-1 text-xs font-medium">{usuario?.rol}</p>
          <p className="theme-muted mt-1 truncate text-xs">{usuario?.correo}</p>
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
                    ? 'theme-chip-active shadow-lg'
                    : 'theme-chip hover:border-[var(--accent-border)]'
                }`
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icono size={18} />
                <span className="truncate">{enlace.label}</span>
              </span>

              {enlace.contador && noLeidas > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--warning)',
                    color: 'var(--button-text)',
                  }}
                >
                  {noLeidas}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <section className="theme-card-soft mt-4 rounded-2xl border p-4 lg:mt-5">
        <div className="flex items-center gap-3">
          <div className="theme-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Palette size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">Tema visual</p>
            <p className="theme-muted truncate text-xs">{theme.nombre}</p>
          </div>
        </div>

        <select
          value={theme.id}
          onChange={(e) => setThemeId(e.target.value)}
          className="theme-input mt-4 w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition"
        >
          {themes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </section>

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
