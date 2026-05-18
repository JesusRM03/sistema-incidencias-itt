import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardList,
  FilePlus2,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  clasesEstado,
  getIncidencias,
  getIncidenciasVisibles,
  ordenarPorFechaDesc,
  puedeCrearIncidencia,
  puedeVerAdministracion,
  puedeVerReportes,
} from '../utils/storage'

export default function Dashboard() {
  const { usuario } = useAuth()
  const { theme } = useTheme()
  const [incidencias, setIncidencias] = useState(() => getIncidencias())

  useEffect(() => {
    const cargar = () => setIncidencias(getIncidencias())

    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [])

  const visibles = useMemo(
    () => getIncidenciasVisibles(incidencias, usuario),
    [incidencias, usuario],
  )

  const total = visibles.length
  const pendientes = visibles.filter((i) => i.estado === 'Pendiente').length
  const proceso = visibles.filter((i) => i.estado === 'En proceso').length
  const resueltas = visibles.filter((i) => i.estado === 'Resuelto').length
  const recientes = ordenarPorFechaDesc(visibles).slice(0, 4)

  const tarjetas = [
    {
      titulo: 'Incidencias visibles',
      valor: total,
      icono: ClipboardList,
      estilo: { backgroundColor: 'var(--secondary)', color: 'var(--button-text)' },
    },
    {
      titulo: 'Pendientes',
      valor: pendientes,
      icono: Clock,
      estilo: { backgroundColor: 'var(--warning)', color: 'var(--button-text)' },
    },
    {
      titulo: 'En proceso',
      valor: proceso,
      icono: AlertCircle,
      estilo: { backgroundColor: 'var(--accent)', color: 'var(--button-text)' },
    },
    {
      titulo: 'Resueltas',
      valor: resueltas,
      icono: CheckCircle2,
      estilo: { backgroundColor: 'var(--accent-strong)', color: 'var(--button-text)' },
    },
  ]

  return (
    <div>
      <p className="theme-kicker text-sm font-semibold">Panel principal</p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">Bienvenido, {usuario?.nombre}</h1>
            <span className="theme-subtle rounded-full border px-3 py-1 text-xs font-bold">
              Tema: {theme.nombre}
            </span>
          </div>
          <p className="theme-muted mt-2 max-w-3xl">
            Rol activo: {usuario?.rol}. El sistema muestra únicamente las
            incidencias permitidas para tu perfil.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {puedeCrearIncidencia(usuario) && (
            <Link
              to="/nueva-incidencia"
              className="theme-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition"
            >
              <FilePlus2 size={18} />
              Nueva incidencia
            </Link>
          )}

          {puedeVerReportes(usuario) && (
            <Link
              to="/reportes"
              className="theme-secondary inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition"
            >
              <ClipboardList size={18} />
              Ver reportes
            </Link>
          )}

          {puedeVerAdministracion(usuario) && (
            <Link
              to="/administracion"
              className="theme-subtle inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition"
            >
              <ShieldCheck size={18} />
              Administración
            </Link>
          )}
        </div>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono

          return (
            <article key={tarjeta.titulo} className="theme-card rounded-2xl border p-5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={tarjeta.estilo}
              >
                <Icono size={24} />
              </div>

              <p className="theme-muted mt-5 text-sm">{tarjeta.titulo}</p>

              <p className="mt-1 text-4xl font-bold">{tarjeta.valor}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="theme-card rounded-2xl border p-6">
          <h2 className="text-xl font-bold">Incidencias recientes</h2>
          <p className="theme-muted mt-2 text-sm">
            Accede al detalle para revisar historial, responsable y acciones
            disponibles según tu rol.
          </p>

          <div className="mt-5 grid gap-3">
            {recientes.length === 0 && (
              <p className="theme-panel rounded-xl border p-4 text-sm">
                Aún no hay incidencias visibles para este usuario.
              </p>
            )}

            {recientes.map((incidencia) => (
              <Link
                key={incidencia.id}
                to={`/incidencias/${encodeURIComponent(incidencia.id)}`}
                className="theme-panel rounded-xl border p-4 transition hover:border-[var(--accent-border)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold">{incidencia.id}</p>
                    <p className="theme-soft-text mt-1 text-sm">
                      {incidencia.tipo} · {incidencia.aula}
                    </p>
                    <p className="theme-muted mt-1 text-xs">{incidencia.fecha}</p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                      clasesEstado[incidencia.estado]
                    }`}
                  >
                    {incidencia.estado}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="theme-card rounded-2xl border p-6">
          <h2 className="text-xl font-bold">Alcance del prototipo</h2>
          <p className="theme-soft-text mt-3 leading-relaxed">
            Esta versión simula el registro, consulta, asignación y seguimiento
            de incidencias de infraestructura del Instituto Tecnológico de
            Toluca. La persistencia continúa en localStorage, por lo que es
            ideal para exposición, pruebas escolares y demostración de roles.
          </p>

          <div className="theme-subtle mt-5 rounded-xl border p-4 text-sm">
            {usuario?.rol === 'Administrador' &&
              'Puedes ver todo el inventario de incidencias, asignar técnicos, consultar reportes y administrar datos demo.'}
            {usuario?.rol === 'Técnico' &&
              'Solo verás incidencias asignadas a ti. Desde el detalle puedes documentar avances y cambiar estados permitidos.'}
            {['Alumno', 'Docente'].includes(usuario?.rol) &&
              'Puedes registrar incidencias y consultar únicamente tus reportes.'}
          </div>
        </article>
      </section>
    </div>
  )
}
