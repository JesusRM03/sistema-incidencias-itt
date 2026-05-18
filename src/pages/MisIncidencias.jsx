import { Eye, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clasesEstado,
  clasesPrioridad,
  ESTADOS_INCIDENCIA,
  getIncidencias,
  getIncidenciasVisibles,
  ordenarPorFechaDesc,
} from '../utils/storage'

export default function MisIncidencias() {
  const { usuario } = useAuth()
  const [incidencias, setIncidencias] = useState(() => getIncidencias())
  const [filtro, setFiltro] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const cargar = () => setIncidencias(getIncidencias())

    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [])

  const visibles = useMemo(
    () => getIncidenciasVisibles(incidencias, usuario),
    [incidencias, usuario],
  )

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const porEstado =
      filtro === 'Todas' ? visibles : visibles.filter((i) => i.estado === filtro)

    const resultado = texto
      ? porEstado.filter((incidencia) =>
          [
            incidencia.id,
            incidencia.tipo,
            incidencia.edificio,
            incidencia.aula,
            incidencia.descripcion,
            incidencia.nombreReportante,
            incidencia.tecnicoAsignado,
          ]
            .join(' ')
            .toLowerCase()
            .includes(texto),
        )
      : porEstado

    return ordenarPorFechaDesc(resultado)
  }, [busqueda, filtro, visibles])

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Seguimiento de incidencias
      </p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Incidencias</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Consulta los reportes disponibles para tu rol. Haz clic en una
            incidencia para ver su detalle, historial y acciones permitidas.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
          {usuario?.rol === 'Administrador' && 'Vista administrativa: todas las incidencias'}
          {usuario?.rol === 'Técnico' && 'Vista técnica: solo incidencias asignadas'}
          {['Alumno', 'Docente'].includes(usuario?.rol) && 'Vista personal: solo tus reportes'}
        </div>
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-wrap gap-3">
          {['Todas', ...ESTADOS_INCIDENCIA].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filtro === estado
                  ? 'bg-emerald-500 text-slate-950'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-400/50 hover:bg-slate-800'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>

        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 focus-within:border-emerald-400">
          <Search size={18} className="text-slate-500" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, área o tipo..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </label>
      </section>

      <section className="mt-8 grid gap-5">
        {filtradas.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300 shadow-lg shadow-slate-950/30">
            No hay incidencias para mostrar con los filtros actuales.
          </div>
        )}

        {filtradas.map((incidencia) => (
          <Link
            key={incidencia.id}
            to={`/incidencias/${encodeURIComponent(incidencia.id)}`}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30 transition hover:border-emerald-400/50 hover:bg-slate-900/80 sm:p-6"
          >
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{incidencia.id}</h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      clasesEstado[incidencia.estado]
                    }`}
                  >
                    {incidencia.estado}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      clasesPrioridad[incidencia.prioridad]
                    }`}
                  >
                    {incidencia.prioridad}
                  </span>
                </div>

                <p className="mt-3 text-lg font-semibold text-white">
                  {incidencia.tipo}
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {incidencia.edificio} · {incidencia.aula}
                </p>

                <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-relaxed text-slate-400">
                  {incidencia.descripcion}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-slate-300 lg:min-w-64">
                <p>
                  <span className="text-slate-500">Fecha:</span> {incidencia.fecha}
                </p>
                <p>
                  <span className="text-slate-500">Reportó:</span>{' '}
                  {incidencia.nombreReportante}
                </p>
                <p>
                  <span className="text-slate-500">Técnico:</span>{' '}
                  {incidencia.tecnicoAsignado || 'Sin asignar'}
                </p>
                <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">
                  <Eye size={17} />
                  Ver detalle
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
