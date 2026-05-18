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
      clase: 'bg-sky-400 text-slate-950',
    },
    {
      titulo: 'Pendientes',
      valor: pendientes,
      icono: Clock,
      clase: 'bg-amber-400 text-slate-950',
    },
    {
      titulo: 'En proceso',
      valor: proceso,
      icono: AlertCircle,
      clase: 'bg-blue-500 text-white',
    },
    {
      titulo: 'Resueltas',
      valor: resueltas,
      icono: CheckCircle2,
      clase: 'bg-emerald-500 text-slate-950',
    },
  ]

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">Panel principal</p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bienvenido, {usuario?.nombre}
          </h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Rol activo: {usuario?.rol}. El sistema muestra únicamente las
            incidencias permitidas para tu perfil.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {puedeCrearIncidencia(usuario) && (
            <Link
              to="/nueva-incidencia"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <FilePlus2 size={18} />
              Nueva incidencia
            </Link>
          )}

          {puedeVerReportes(usuario) && (
            <Link
              to="/reportes"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-200 transition hover:bg-sky-400/20"
            >
              <ClipboardList size={18} />
              Ver reportes
            </Link>
          )}

          {puedeVerAdministracion(usuario) && (
            <Link
              to="/administracion"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:bg-emerald-400/20"
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
            <article
              key={tarjeta.titulo}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${tarjeta.clase}`}
              >
                <Icono size={24} />
              </div>

              <p className="mt-5 text-sm text-slate-400">{tarjeta.titulo}</p>

              <p className="mt-1 text-4xl font-bold text-white">{tarjeta.valor}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-bold text-white">Incidencias recientes</h2>
          <p className="mt-2 text-sm text-slate-400">
            Accede al detalle para revisar historial, responsable y acciones
            disponibles según tu rol.
          </p>

          <div className="mt-5 grid gap-3">
            {recientes.length === 0 && (
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                Aún no hay incidencias visibles para este usuario.
              </p>
            )}

            {recientes.map((incidencia) => (
              <Link
                key={incidencia.id}
                to={`/incidencias/${encodeURIComponent(incidencia.id)}`}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-400/50 hover:bg-slate-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{incidencia.id}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {incidencia.tipo} · {incidencia.aula}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{incidencia.fecha}</p>
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

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-bold text-white">Alcance del prototipo</h2>
          <p className="mt-3 leading-relaxed text-slate-300">
            Esta versión simula el registro, consulta, asignación y seguimiento
            de incidencias de infraestructura del Instituto Tecnológico de
            Toluca. La persistencia continúa en localStorage, por lo que es
            ideal para exposición, pruebas escolares y demostración de roles.
          </p>

          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
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
