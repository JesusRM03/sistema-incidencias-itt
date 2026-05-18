import { ArrowLeft, CheckCircle2, Send, UserCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clasesEstado,
  clasesPrioridad,
  crearNotificaciones,
  esCambioEstadoPermitido,
  ESTADOS_INCIDENCIA,
  formatearFecha,
  getCorreosAdministradores,
  getDestinatariosIncidencia,
  getEstadosPermitidos,
  getIncidencias,
  getIncidenciasVisibles,
  getUsuarios,
  guardarIncidencias,
  puedeAsignarTecnico,
  puedeGestionarIncidencia,
  ROLES,
} from '../utils/storage'

export default function DetalleIncidencia() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const incidenciaId = decodeURIComponent(id || '')

  const [incidencias, setIncidencias] = useState(() => getIncidencias())
  const [usuarios, setUsuarios] = useState(() => getUsuarios())
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('')
  const [comentarioAsignacion, setComentarioAsignacion] = useState('')
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('')
  const [comentarioEstado, setComentarioEstado] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = () => {
      setIncidencias(getIncidencias())
      setUsuarios(getUsuarios())
    }

    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [])

  const incidencia = useMemo(
    () => incidencias.find((item) => item.id === incidenciaId),
    [incidenciaId, incidencias],
  )

  const tieneAcceso = useMemo(() => {
    if (!incidencia) return false
    return getIncidenciasVisibles(incidencias, usuario).some(
      (item) => item.id === incidencia.id,
    )
  }, [incidencia, incidencias, usuario])

  const tecnicos = useMemo(
    () => usuarios.filter((item) => item.rol === ROLES.TECNICO),
    [usuarios],
  )

  const estadosPermitidos = useMemo(() => {
    if (!incidencia) return ESTADOS_INCIDENCIA
    return getEstadosPermitidos(incidencia.estado, usuario)
  }, [incidencia, usuario])

  const tecnicoActualFormulario = tecnicoSeleccionado || incidencia?.tecnicoCorreo || ''
  const estadoActualFormulario = estadoSeleccionado || incidencia?.estado || ''

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const actualizarIncidencia = (transformar) => {
    const actuales = getIncidencias()
    const actualizadas = actuales.map((item) =>
      item.id === incidencia.id ? transformar(item) : item,
    )
    guardarIncidencias(actualizadas)
    setIncidencias(actualizadas)
    return actualizadas.find((item) => item.id === incidencia.id)
  }

  const asignarTecnico = (e) => {
    e.preventDefault()
    limpiarMensajes()

    if (!tecnicoActualFormulario) {
      setError('Selecciona un técnico para asignar la incidencia.')
      return
    }

    const tecnico = tecnicos.find((item) => item.correo === tecnicoActualFormulario)
    if (!tecnico) {
      setError('No se encontró el técnico seleccionado.')
      return
    }

    const ahora = new Date()
    const nuevoEstado = incidencia.estado === 'Pendiente' ? 'En proceso' : incidencia.estado
    const comentario =
      comentarioAsignacion.trim() ||
      `Administrador asignó la incidencia a ${tecnico.nombre}.`

    const actualizada = actualizarIncidencia((item) => ({
      ...item,
      tecnicoAsignado: tecnico.nombre,
      tecnicoCorreo: tecnico.correo,
      estado: nuevoEstado,
      historial: [
        ...item.historial,
        {
          estado: nuevoEstado,
          comentario,
          fecha: formatearFecha(ahora),
          fechaISO: ahora.toISOString(),
          responsable: usuario.nombre,
        },
      ],
    }))

    crearNotificaciones(
      [actualizada.reportadoPor, tecnico.correo, ...getCorreosAdministradores()],
      {
        titulo: 'Técnico asignado',
        mensaje: `${usuario.nombre} asignó ${actualizada.id} a ${tecnico.nombre}.`,
        incidenciaId: actualizada.id,
        tipo: 'asignacion',
      },
    )

    setComentarioAsignacion('')
    setMensaje('Técnico asignado y notificaciones generadas.')
  }

  const guardarCambioEstado = (e) => {
    e.preventDefault()
    limpiarMensajes()

    if (!comentarioEstado.trim()) {
      setError('Agrega un comentario de avance antes de guardar.')
      return
    }

    if (!esCambioEstadoPermitido(incidencia.estado, estadoActualFormulario, usuario)) {
      setError('El cambio de estado seleccionado no está permitido para tu rol.')
      return
    }

    const ahora = new Date()
    const comentario = comentarioEstado.trim()

    const actualizada = actualizarIncidencia((item) => ({
      ...item,
      estado: estadoActualFormulario,
      historial: [
        ...item.historial,
        {
          estado: estadoActualFormulario,
          comentario,
          fecha: formatearFecha(ahora),
          fechaISO: ahora.toISOString(),
          responsable: usuario.nombre,
        },
      ],
    }))

    const titulo =
      estadoActualFormulario === 'Resuelto'
        ? 'Incidencia resuelta'
        : estadoActualFormulario === 'Cerrado'
          ? 'Incidencia cerrada'
          : 'Cambio de estado'

    crearNotificaciones(getDestinatariosIncidencia(actualizada), {
      titulo,
      mensaje: `${actualizada.id} cambió a ${estadoActualFormulario}. Comentario: ${comentario}`,
      incidenciaId: actualizada.id,
      tipo: 'estado',
    })

    setComentarioEstado('')
    setEstadoSeleccionado(estadoActualFormulario)
    setMensaje('Historial actualizado y notificaciones generadas.')
  }

  if (!incidencia) {
    return (
      <VistaMensaje
        titulo="Incidencia no encontrada"
        texto="La incidencia solicitada no existe o fue eliminada de los datos locales."
        onBack={() => navigate('/mis-incidencias')}
      />
    )
  }

  if (!tieneAcceso) {
    return (
      <VistaMensaje
        titulo="Acceso restringido"
        texto="Tu rol no tiene permiso para consultar esta incidencia."
        onBack={() => navigate('/mis-incidencias')}
      />
    )
  }

  const puedeAsignar = puedeAsignarTecnico(usuario)
  const puedeGestionar = puedeGestionarIncidencia(incidencia, usuario)

  return (
    <div>
      <button
        onClick={() => navigate('/mis-incidencias')}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:bg-slate-800"
      >
        <ArrowLeft size={18} />
        Regresar a la lista
      </button>

      <div className="mt-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <p className="text-sm font-semibold text-emerald-400">
            Detalle de incidencia
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{incidencia.id}</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Revisa datos completos, responsable asignado, estado actual e
            historial de seguimiento.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span
            className={`rounded-full border px-4 py-2 text-sm font-bold ${
              clasesEstado[incidencia.estado]
            }`}
          >
            {incidencia.estado}
          </span>
          <span
            className={`rounded-full border px-4 py-2 text-sm font-bold ${
              clasesPrioridad[incidencia.prioridad]
            }`}
          >
            Prioridad {incidencia.prioridad}
          </span>
        </div>
      </div>

      {(mensaje || error) && (
        <div
          className={`mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
            mensaje
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
              : 'border-red-400/30 bg-red-400/10 text-red-100'
          }`}
        >
          <CheckCircle2 size={20} />
          {mensaje || error}
        </div>
      )}

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
            <h2 className="text-xl font-bold text-white">Información general</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CampoDetalle label="ID" value={incidencia.id} />
              <CampoDetalle label="Tipo de falla" value={incidencia.tipo} />
              <CampoDetalle label="Prioridad" value={incidencia.prioridad} />
              <CampoDetalle label="Estado actual" value={incidencia.estado} />
              <CampoDetalle label="Edificio o área" value={incidencia.edificio} />
              <CampoDetalle label="Aula o punto específico" value={incidencia.aula} />
              <CampoDetalle label="Fecha de registro" value={incidencia.fecha} />
              <CampoDetalle label="Usuario que reportó" value={incidencia.nombreReportante} />
              <CampoDetalle label="Correo reportante" value={incidencia.reportadoPor} />
              <CampoDetalle
                label="Técnico asignado"
                value={incidencia.tecnicoAsignado || 'Sin asignar'}
              />
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descripción
                </p>
                <p className="mt-2 leading-relaxed text-slate-200">
                  {incidencia.descripcion}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Evidencia simulada
                </p>
                <p className="mt-2 text-slate-200">
                  {incidencia.evidencia || 'Sin evidencia registrada.'}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
            <h2 className="text-xl font-bold text-white">Historial</h2>
            <p className="mt-2 text-sm text-slate-400">
              Cada movimiento conserva responsable, fecha, estado y comentario.
            </p>

            <div className="mt-6 grid gap-4">
              {incidencia.historial.map((item, index) => (
                <div
                  key={`${item.fechaISO}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-semibold text-white">{item.responsable}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.fecha}</p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                        clasesEstado[item.estado] || clasesEstado.Pendiente
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {item.comentario}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="grid gap-6 self-start">
          {puedeAsignar && (
            <form
              onSubmit={asignarTecnico}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400 text-slate-950">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Asignación técnica</h2>
                  <p className="text-sm text-slate-400">Solo administrador.</p>
                </div>
              </div>

              <label className="mt-5 block text-sm font-medium text-white">
                Técnico
              </label>
              <select
                value={tecnicoActualFormulario}
                onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">Selecciona técnico</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.correo} value={tecnico.correo}>
                    {tecnico.nombre}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium text-white">
                Comentario de asignación
              </label>
              <textarea
                value={comentarioAsignacion}
                onChange={(e) => setComentarioAsignacion(e.target.value)}
                rows="3"
                placeholder="Ej. Se asigna por prioridad alta y cercanía del área."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />

              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-sky-300">
                <UserCheck size={18} />
                Asignar técnico
              </button>
            </form>
          )}

          {puedeGestionar && (
            <form
              onSubmit={guardarCambioEstado}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
                  <Send size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-white">Seguimiento</h2>
                  <p className="text-sm text-slate-400">
                    Cambio de estado o comentario de avance.
                  </p>
                </div>
              </div>

              <label className="mt-5 block text-sm font-medium text-white">
                Estado
              </label>
              <select
                value={estadoActualFormulario}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                {estadosPermitidos.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium text-white">
                Comentario
              </label>
              <textarea
                value={comentarioEstado}
                onChange={(e) => setComentarioEstado(e.target.value)}
                rows="4"
                placeholder="Describe el avance, revisión realizada o motivo del cambio."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />

              <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
                <Send size={18} />
                Guardar seguimiento
              </button>
            </form>
          )}
        </aside>
      </section>
    </div>
  )
}

function CampoDetalle({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function VistaMensaje({ titulo, texto, onBack }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
      <h1 className="text-2xl font-bold text-white">{titulo}</h1>
      <p className="mt-2 text-slate-400">{texto}</p>
      <button
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
      >
        <ArrowLeft size={18} />
        Regresar a incidencias
      </button>
    </div>
  )
}
