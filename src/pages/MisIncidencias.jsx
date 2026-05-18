import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const clasesEstado = {
  Pendiente: 'bg-orange-500/10 text-orange-300 border-orange-700',
  'En proceso': 'bg-blue-500/10 text-blue-300 border-blue-700',
  'En revisión': 'bg-purple-500/10 text-purple-300 border-purple-700',
  Resuelto: 'bg-emerald-500/10 text-emerald-300 border-emerald-700',
  Cerrado: 'bg-slate-500/10 text-slate-300 border-slate-700',
  Cancelado: 'bg-red-500/10 text-red-300 border-red-700',
}

export default function MisIncidencias() {
  const { usuario } = useAuth()
  const [incidencias, setIncidencias] = useState([])
  const [filtro, setFiltro] = useState('Todas')

  useEffect(() => {
    cargar()
  }, [])

  const cargar = () => {
    const datos = JSON.parse(localStorage.getItem('incidenciasITT')) || []
    setIncidencias(datos)
  }

  const visibles =
    usuario?.rol === 'Administrador'
      ? incidencias
      : usuario?.rol === 'Técnico'
        ? incidencias.filter((i) => i.tecnicoAsignado === usuario.nombre)
        : incidencias.filter((i) => i.reportadoPor === usuario?.correo)

  const filtradas =
    filtro === 'Todas' ? visibles : visibles.filter((i) => i.estado === filtro)

  const actualizarEstado = (id, nuevoEstado) => {
    const actualizadas = incidencias.map((incidencia) => {
      if (incidencia.id !== id) return incidencia

      return {
        ...incidencia,
        estado: nuevoEstado,
        historial: [
          ...incidencia.historial,
          {
            estado: nuevoEstado,
            comentario: `Estado actualizado a ${nuevoEstado}.`,
            fecha: new Date().toLocaleString('es-MX'),
            responsable: usuario.nombre,
          },
        ],
      }
    })

    localStorage.setItem('incidenciasITT', JSON.stringify(actualizadas))
    setIncidencias(actualizadas)
  }

  const asignarTecnico = (id) => {
    const actualizadas = incidencias.map((incidencia) => {
      if (incidencia.id !== id) return incidencia

      return {
        ...incidencia,
        tecnicoAsignado: 'Técnico de Mantenimiento',
        estado: 'En proceso',
        historial: [
          ...incidencia.historial,
          {
            estado: 'En proceso',
            comentario: 'Administrador asignó la incidencia al técnico.',
            fecha: new Date().toLocaleString('es-MX'),
            responsable: usuario.nombre,
          },
        ],
      }
    })

    localStorage.setItem('incidenciasITT', JSON.stringify(actualizadas))
    setIncidencias(actualizadas)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Seguimiento de incidencias
      </p>

      <h1 className="mt-2 text-3xl font-bold text-white">Incidencias</h1>

      <p className="mt-2 text-slate-400">
        Consulta los reportes registrados y revisa su estado de atención.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          'Todas',
          'Pendiente',
          'En proceso',
          'En revisión',
          'Resuelto',
          'Cerrado',
          'Cancelado',
        ].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filtro === estado
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-5">
        {filtradas.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            No hay incidencias para mostrar.
          </div>
        )}

        {filtradas.map((incidencia) => (
          <article
            key={incidencia.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-white">
                    {incidencia.id}
                  </h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      clasesEstado[incidencia.estado]
                    }`}
                  >
                    {incidencia.estado}
                  </span>
                </div>

                <p className="mt-3 text-slate-300">
                  <strong>Tipo:</strong> {incidencia.tipo}
                </p>

                <p className="text-slate-300">
                  <strong>Ubicación:</strong> Edificio {incidencia.edificio},{' '}
                  {incidencia.aula}
                </p>

                <p className="text-slate-300">
                  <strong>Prioridad:</strong> {incidencia.prioridad}
                </p>

                <p className="text-slate-300">
                  <strong>Fecha:</strong> {incidencia.fecha}
                </p>

                <p className="text-slate-300">
                  <strong>Reportó:</strong> {incidencia.nombreReportante}
                </p>

                <p className="text-slate-300">
                  <strong>Técnico asignado:</strong>{' '}
                  {incidencia.tecnicoAsignado || 'Sin asignar'}
                </p>

                <p className="mt-4 rounded-xl bg-slate-950 p-4 text-slate-300">
                  {incidencia.descripcion}
                </p>
              </div>

              <div className="flex min-w-60 flex-col gap-3">
                {usuario?.rol === 'Administrador' && !incidencia.tecnicoAsignado && (
                  <button
                    onClick={() => asignarTecnico(incidencia.id)}
                    className="rounded-xl bg-blue-500 px-4 py-3 font-bold text-white transition hover:bg-blue-400"
                  >
                    Asignar técnico
                  </button>
                )}

                {(usuario?.rol === 'Administrador' ||
                  usuario?.rol === 'Técnico') && (
                  <select
                    value={incidencia.estado}
                    onChange={(e) =>
                      actualizarEstado(incidencia.id, e.target.value)
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>En revisión</option>
                    <option>Resuelto</option>
                    <option>Cerrado</option>
                    <option>Cancelado</option>
                  </select>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-5">
              <h3 className="font-bold text-white">Historial</h3>

              <div className="mt-3 grid gap-3">
                {incidencia.historial.map((h, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"
                  >
                    <p>
                      <strong>Estado:</strong> {h.estado}
                    </p>
                    <p>
                      <strong>Comentario:</strong> {h.comentario}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {h.fecha}
                    </p>
                    <p>
                      <strong>Responsable:</strong> {h.responsable}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}