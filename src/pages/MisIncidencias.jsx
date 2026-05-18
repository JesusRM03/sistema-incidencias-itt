import {
  CheckCircle2,
  CopyCheck,
  Eye,
  Search,
  Square,
  SquareCheckBig,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clasesEstado,
  clasesPrioridad,
  crearNotificaciones,
  ESTADOS_INCIDENCIA,
  formatearFecha,
  getDestinatariosIncidencia,
  getIncidencias,
  getIncidenciasVisibles,
  guardarIncidencias,
  obtenerIdsDuplicadosRepetidos,
  ordenarPorFechaDesc,
  puedeGestionarIncidencia,
  ROLES,
} from '../utils/storage'

export default function MisIncidencias() {
  const { usuario } = useAuth()
  const [incidencias, setIncidencias] = useState(() => getIncidencias())
  const [filtro, setFiltro] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadas, setSeleccionadas] = useState([])
  const [mensaje, setMensaje] = useState('')

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
            incidencia.evidencia,
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

  const idsFiltradas = filtradas.map((incidencia) => incidencia.id)
  const idsSeleccionadasVisibles = seleccionadas.filter((id) =>
    idsFiltradas.includes(id),
  )
  const todasFiltradasSeleccionadas =
    idsFiltradas.length > 0 && idsFiltradas.every((id) => seleccionadas.includes(id))
  const accionesMasivas = [ROLES.ADMINISTRADOR, ROLES.TECNICO].includes(usuario?.rol)
  const idsDuplicadas = obtenerIdsDuplicadosRepetidos(filtradas)

  const toggleSeleccion = (id) => {
    setMensaje('')
    setSeleccionadas((actuales) =>
      actuales.includes(id)
        ? actuales.filter((seleccionada) => seleccionada !== id)
        : [...actuales, id],
    )
  }

  const seleccionarVisibles = () => {
    setMensaje('')

    if (todasFiltradasSeleccionadas) {
      setSeleccionadas((actuales) =>
        actuales.filter((id) => !idsFiltradas.includes(id)),
      )
      return
    }

    setSeleccionadas((actuales) => [...new Set([...actuales, ...idsFiltradas])])
  }

  const seleccionarDuplicadas = () => {
    if (idsDuplicadas.length === 0) {
      setMensaje('No se detectaron reportes repetidos en la vista actual.')
      return
    }

    setSeleccionadas(idsDuplicadas)
    setMensaje(
      `Se seleccionaron ${idsDuplicadas.length} reportes repetidos. Revisa y aplica una acción masiva.`,
    )
  }

  const cambiarEstadoMasivo = (nuevoEstado) => {
    const ids = new Set(idsSeleccionadasVisibles)
    const ahora = new Date()
    let total = 0

    const actualizadas = incidencias.map((incidencia) => {
      if (!ids.has(incidencia.id)) return incidencia
      if (!puedeGestionarIncidencia(incidencia, usuario)) return incidencia

      total += 1

      return {
        ...incidencia,
        estado: nuevoEstado,
        historial: [
          ...incidencia.historial,
          {
            estado: nuevoEstado,
            comentario: `Acción masiva: incidencia marcada como ${nuevoEstado} desde el listado.`,
            fecha: formatearFecha(ahora),
            fechaISO: ahora.toISOString(),
            responsable: usuario.nombre,
          },
        ],
      }
    })

    if (total === 0) {
      setMensaje('No hay incidencias seleccionadas que puedas actualizar.')
      return
    }

    guardarIncidencias(actualizadas)
    setIncidencias(actualizadas)

    actualizadas
      .filter((incidencia) => ids.has(incidencia.id))
      .forEach((incidencia) => {
        crearNotificaciones(getDestinatariosIncidencia(incidencia), {
          titulo: `Incidencia marcada como ${nuevoEstado}`,
          mensaje: `${incidencia.id} fue actualizada en lote por ${usuario.nombre}.`,
          incidenciaId: incidencia.id,
          tipo: 'estado',
        })
      })

    setSeleccionadas([])
    setMensaje(`${total} incidencia(s) actualizada(s) a ${nuevoEstado}.`)
  }

  const eliminarSeleccionadas = () => {
    if (usuario?.rol !== ROLES.ADMINISTRADOR) {
      setMensaje('Solo el Administrador puede eliminar incidencias.')
      return
    }

    const ids = new Set(idsSeleccionadasVisibles)
    const total = incidencias.filter((incidencia) => ids.has(incidencia.id)).length

    if (total === 0) {
      setMensaje('Selecciona al menos una incidencia para eliminar.')
      return
    }

    const confirmado = window.confirm(
      `¿Deseas eliminar ${total} incidencia(s) seleccionada(s)? Esta acción solo afecta localStorage.`,
    )

    if (!confirmado) return

    const restantes = incidencias.filter((incidencia) => !ids.has(incidencia.id))
    guardarIncidencias(restantes)
    setIncidencias(restantes)
    setSeleccionadas([])
    setMensaje(`${total} incidencia(s) eliminada(s) del prototipo.`)
  }

  return (
    <div>
      <p className="theme-kicker text-sm font-semibold">
        Seguimiento de incidencias
      </p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold">Incidencias</h1>
          <p className="theme-muted mt-2 max-w-3xl">
            Consulta los reportes disponibles para tu rol. Puedes seleccionar
            varias incidencias para resolver reportes repetidos sin entrar una por una.
          </p>
        </div>

        <div className="theme-card-soft rounded-2xl border px-4 py-3 text-sm">
          {usuario?.rol === ROLES.ADMINISTRADOR && 'Vista administrativa: todas las incidencias'}
          {usuario?.rol === ROLES.TECNICO && 'Vista técnica: solo incidencias asignadas'}
          {['Alumno', 'Docente'].includes(usuario?.rol) && 'Vista personal: solo tus reportes'}
        </div>
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-wrap gap-3">
          {['Todas', ...ESTADOS_INCIDENCIA].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                filtro === estado ? 'theme-chip-active' : 'theme-chip'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>

        <label className="theme-input flex min-w-0 items-center gap-3 rounded-xl border px-4 py-2">
          <Search size={18} className="theme-muted" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, área, evidencia o tipo..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </label>
      </section>

      {accionesMasivas && (
        <section className="theme-card mt-6 rounded-2xl border p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="font-bold">Acciones masivas</h2>
              <p className="theme-muted mt-1 text-sm">
                Seleccionadas: {idsSeleccionadasVisibles.length}. Duplicadas
                repetidas detectadas en esta vista: {idsDuplicadas.length}.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={seleccionarVisibles}
                className="theme-secondary inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition"
              >
                <SquareCheckBig size={17} />
                {todasFiltradasSeleccionadas ? 'Quitar selección' : 'Seleccionar vista'}
              </button>

              <button
                onClick={seleccionarDuplicadas}
                className="theme-secondary inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition"
              >
                <CopyCheck size={17} />
                Seleccionar repetidas
              </button>

              <button
                onClick={() => cambiarEstadoMasivo('Resuelto')}
                className="theme-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition"
              >
                <CheckCircle2 size={17} />
                Marcar resueltas
              </button>

              {usuario?.rol === ROLES.ADMINISTRADOR && (
                <>
                  <button
                    onClick={() => cambiarEstadoMasivo('Cancelado')}
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      borderColor: 'rgba(220, 38, 38, 0.42)',
                      color: 'var(--danger)',
                    }}
                  >
                    <XCircle size={17} />
                    Cancelar
                  </button>

                  <button
                    onClick={eliminarSeleccionadas}
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      borderColor: 'rgba(220, 38, 38, 0.42)',
                      color: 'var(--danger)',
                    }}
                  >
                    <Trash2 size={17} />
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {mensaje && (
        <div className="theme-subtle mt-5 rounded-2xl border p-4 text-sm font-semibold">
          {mensaje}
        </div>
      )}

      <section className="mt-8 grid gap-5">
        {filtradas.length === 0 && (
          <div className="theme-card rounded-2xl border p-6">
            No hay incidencias para mostrar con los filtros actuales.
          </div>
        )}

        {filtradas.map((incidencia) => {
          const seleccionada = seleccionadas.includes(incidencia.id)

          return (
            <article
              key={incidencia.id}
              className="theme-card rounded-2xl border p-5 transition hover:border-[var(--accent-border)] sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="flex min-w-0 gap-4">
                  {accionesMasivas && (
                    <button
                      type="button"
                      onClick={() => toggleSeleccion(incidencia.id)}
                      className="mt-1 h-9 w-9 shrink-0 rounded-xl text-[var(--accent-text)]"
                      aria-label={
                        seleccionada
                          ? `Quitar selección de ${incidencia.id}`
                          : `Seleccionar ${incidencia.id}`
                      }
                    >
                      {seleccionada ? <SquareCheckBig size={24} /> : <Square size={24} />}
                    </button>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold">{incidencia.id}</h2>

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

                    <p className="mt-3 text-lg font-semibold">{incidencia.tipo}</p>

                    <p className="theme-soft-text mt-2 text-sm">
                      {incidencia.edificio} · {incidencia.aula}
                    </p>

                    <p className="theme-muted mt-3 line-clamp-2 max-w-4xl text-sm leading-relaxed">
                      {incidencia.descripcion}
                    </p>

                    {incidencia.evidencia && (
                      <p className="theme-muted mt-2 text-xs">
                        Evidencia: {incidencia.evidencia}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 text-sm lg:min-w-64">
                  <p>
                    <span className="theme-muted">Fecha:</span> {incidencia.fecha}
                  </p>
                  <p>
                    <span className="theme-muted">Reportó:</span>{' '}
                    {incidencia.nombreReportante}
                  </p>
                  <p>
                    <span className="theme-muted">Técnico:</span>{' '}
                    {incidencia.tecnicoAsignado || 'Sin asignar'}
                  </p>
                  <Link
                    to={`/incidencias/${encodeURIComponent(incidencia.id)}`}
                    className="theme-primary mt-2 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                  >
                    <Eye size={17} />
                    Ver detalle
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
