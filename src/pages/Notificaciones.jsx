import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getIncidencias,
  getIncidenciasVisibles,
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  ordenarPorFechaDesc,
} from '../utils/storage'

export default function Notificaciones() {
  const { usuario } = useAuth()
  const correoUsuario = usuario?.correo || ''
  const [notificaciones, setNotificaciones] = useState(() => getNotificaciones())
  const [incidencias, setIncidencias] = useState(() => getIncidencias())

  useEffect(() => {
    const cargar = () => {
      setNotificaciones(getNotificaciones())
      setIncidencias(getIncidencias())
    }

    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [])

  const propias = useMemo(
    () =>
      ordenarPorFechaDesc(
        notificaciones.filter(
          (notificacion) => notificacion.destinatarioCorreo === correoUsuario,
        ),
      ),
    [notificaciones, correoUsuario],
  )

  const incidenciasVisibles = useMemo(
    () => getIncidenciasVisibles(incidencias, usuario),
    [incidencias, usuario],
  )

  const noLeidas = propias.filter((notificacion) => !notificacion.leida).length

  const marcarLeida = (id) => {
    setNotificaciones(marcarNotificacionLeida(id))
  }

  const marcarTodas = () => {
    setNotificaciones(marcarTodasNotificacionesLeidas(correoUsuario))
  }

  const puedeAbrirIncidencia = (incidenciaId) =>
    incidenciasVisibles.some((incidencia) => incidencia.id === incidenciaId)

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">Centro de avisos</p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Notificaciones</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Avisos simulados guardados en localStorage sobre registros,
            asignaciones y cambios de estado.
          </p>
        </div>

        <button
          onClick={marcarTodas}
          disabled={noLeidas === 0}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          <CheckCheck size={18} />
          Marcar todas como leídas
        </button>
      </div>

      <section className="mt-8 grid gap-4">
        {propias.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300 shadow-lg shadow-slate-950/30">
            No hay notificaciones para este usuario.
          </div>
        )}

        {propias.map((notificacion) => {
          const abierta = puedeAbrirIncidencia(notificacion.incidenciaId)

          return (
            <article
              key={notificacion.id}
              className={`rounded-2xl border p-5 shadow-lg shadow-slate-950/30 ${
                notificacion.leida
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-emerald-400/40 bg-emerald-400/10'
              }`}
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notificacion.leida
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    <Bell size={20} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold text-white">{notificacion.titulo}</h2>
                      {!notificacion.leida && (
                        <span className="rounded-full bg-orange-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                          Nueva
                        </span>
                      )}
                    </div>
                    <p className="mt-2 leading-relaxed text-slate-300">
                      {notificacion.mensaje}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {notificacion.fecha}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  {abierta && (
                    <Link
                      to={`/incidencias/${encodeURIComponent(
                        notificacion.incidenciaId,
                      )}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
                    >
                      <ExternalLink size={17} />
                      Ver incidencia
                    </Link>
                  )}

                  {!notificacion.leida && (
                    <button
                      onClick={() => marcarLeida(notificacion.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                      <CheckCheck size={17} />
                      Marcar leída
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
