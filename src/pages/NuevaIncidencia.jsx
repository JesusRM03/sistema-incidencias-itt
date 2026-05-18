import { CheckCircle2, FileText, MapPin, Maximize2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import mapaITT from '../assets/mapa-itt.jpg'
import { useAuth } from '../context/AuthContext'
import {
  crearNotificaciones,
  detectarIncidenciasDuplicadas,
  EDIFICIO_T,
  EDIFICIOS_ITT,
  formatearFecha,
  getCorreosAdministradores,
  getIncidencias,
  guardarIncidencias,
  PRIORIDADES,
  TIPOS_FALLA,
} from '../utils/storage'

const estadoInicial = {
  tipo: '',
  edificio: '',
  aula: '',
  descripcion: '',
  prioridad: '',
  evidencia: '',
}

export default function NuevaIncidencia() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [formulario, setFormulario] = useState(estadoInicial)
  const [errores, setErrores] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [mapaAbierto, setMapaAbierto] = useState(false)
  const [permitirDuplicado, setPermitirDuplicado] = useState(false)

  const posiblesDuplicados = useMemo(
    () => detectarIncidenciasDuplicadas(formulario, getIncidencias()).slice(0, 4),
    [formulario],
  )

  const cambiar = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    })
    setPermitirDuplicado(false)
    setErrores({
      ...errores,
      [e.target.name]: '',
    })
  }

  const validar = () => {
    const nuevosErrores = {}

    if (!formulario.tipo) nuevosErrores.tipo = 'Selecciona el tipo de falla.'
    if (!formulario.prioridad) nuevosErrores.prioridad = 'Selecciona la prioridad.'
    if (!formulario.edificio) nuevosErrores.edificio = 'Selecciona el edificio o área.'
    if (!formulario.aula.trim()) {
      nuevosErrores.aula = 'Indica el aula, laboratorio o punto específico.'
    }
    if (formulario.descripcion.trim().length < 10) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 10 caracteres.'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const guardar = (e) => {
    e.preventDefault()
    setMensajeExito('')

    if (!validar()) return

    if (posiblesDuplicados.length > 0 && !permitirDuplicado) {
      setErrores({
        duplicado:
          'Se encontraron reportes activos muy parecidos. Revísalos antes de registrar otro.',
      })
      return
    }

    const ahora = new Date()
    const incidencias = getIncidencias()

    const nueva = {
      id: `INC-${Date.now()}`,
      tipo: formulario.tipo,
      edificio: formulario.edificio,
      aula: formulario.aula.trim(),
      descripcion: formulario.descripcion.trim(),
      prioridad: formulario.prioridad,
      evidencia: formulario.evidencia.trim(),
      estado: 'Pendiente',
      fecha: formatearFecha(ahora),
      fechaISO: ahora.toISOString(),
      reportadoPor: usuario.correo,
      nombreReportante: usuario.nombre,
      tecnicoAsignado: '',
      tecnicoCorreo: '',
      historial: [
        {
          estado: 'Pendiente',
          comentario: 'Incidencia registrada por el usuario.',
          fecha: formatearFecha(ahora),
          fechaISO: ahora.toISOString(),
          responsable: usuario.nombre,
        },
      ],
    }

    guardarIncidencias([nueva, ...incidencias])

    crearNotificaciones([usuario.correo, ...getCorreosAdministradores()], {
      titulo: 'Nueva incidencia registrada',
      mensaje: `${usuario.nombre} registró la incidencia ${nueva.id} en ${nueva.aula}.`,
      incidenciaId: nueva.id,
      tipo: 'registro',
    })

    setMensajeExito(`Incidencia ${nueva.id} registrada correctamente.`)
    setFormulario(estadoInicial)

    setTimeout(() => {
      navigate('/mis-incidencias')
    }, 1200)
  }

  return (
    <div>
      <p className="theme-kicker text-sm font-semibold">Registro de incidencia</p>

      <h1 className="mt-2 text-3xl font-bold">Nueva incidencia</h1>

      <p className="theme-muted mt-2 max-w-3xl">
        Captura la falla con ubicación clara, prioridad y una descripción breve
        pero suficiente. Puedes apoyarte en el mapa para ubicar edificio, aula o
        punto específico.
      </p>

      {mensajeExito && (
        <div className="theme-subtle mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold">
          <CheckCircle2 size={20} />
          {mensajeExito}
        </div>
      )}

      <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <form
          onSubmit={guardar}
          className="theme-card grid gap-6 rounded-2xl border p-5 sm:p-6 lg:grid-cols-2"
        >
          <CampoSelect
            label="Tipo de falla"
            name="tipo"
            value={formulario.tipo}
            onChange={cambiar}
            error={errores.tipo}
            placeholder="Selecciona una falla"
            opciones={TIPOS_FALLA}
          />

          <CampoSelect
            label="Prioridad"
            name="prioridad"
            value={formulario.prioridad}
            onChange={cambiar}
            error={errores.prioridad}
            placeholder="Selecciona prioridad"
            opciones={PRIORIDADES}
          />

          <div className="lg:col-span-2">
            <CampoSelect
              label="Edificio o área"
              name="edificio"
              value={formulario.edificio}
              onChange={cambiar}
              error={errores.edificio}
              placeholder="Selecciona el edificio o área"
              opciones={EDIFICIOS_ITT}
            />
            <p className="theme-muted mt-2 text-xs">{EDIFICIO_T}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Aula, laboratorio o punto específico
            </label>

            <input
              name="aula"
              value={formulario.aula}
              onChange={cambiar}
              placeholder="Ej. Aula F-12, Laboratorio T-02"
              className="theme-input mt-2 w-full rounded-xl border px-4 py-3 outline-none transition placeholder:text-slate-500"
            />

            {errores.aula && (
              <p className="mt-2 text-sm text-red-300">{errores.aula}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Evidencia simulada</label>

            <div className="theme-input mt-2 flex rounded-xl border">
              <span className="theme-muted flex items-center px-4">
                <FileText size={18} />
              </span>
              <input
                name="evidencia"
                value={formulario.evidencia}
                onChange={cambiar}
                placeholder="Ej. Foto tomada, nota de evidencia..."
                className="min-w-0 flex-1 rounded-xl bg-transparent py-3 pr-4 outline-none placeholder:text-slate-500"
              />
            </div>

            <p className="theme-muted mt-2 text-xs">
              No se sube archivo real; solo se registra una nota o nombre.
            </p>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium">
              Descripción de la incidencia
            </label>

            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiar}
              rows="5"
              placeholder="Describe con claridad qué falla, desde cuándo y si afecta una clase o servicio."
              className="theme-input mt-2 w-full rounded-xl border px-4 py-3 outline-none transition placeholder:text-slate-500"
            />

            {errores.descripcion && (
              <p className="mt-2 text-sm text-red-300">{errores.descripcion}</p>
            )}
          </div>

          {posiblesDuplicados.length > 0 && (
            <div className="theme-subtle lg:col-span-2 rounded-2xl border p-4">
              <p className="font-bold">Posible reporte duplicado</p>
              <p className="mt-1 text-sm">
                Ya existen incidencias activas con ubicación, tipo o evidencia
                similar. Puedes abrirlas para revisarlas antes de registrar otra.
              </p>

              <div className="mt-3 grid gap-2">
                {posiblesDuplicados.map((incidencia) => (
                  <Link
                    key={incidencia.id}
                    to={`/incidencias/${encodeURIComponent(incidencia.id)}`}
                    className="theme-panel rounded-xl border p-3 text-sm font-semibold"
                  >
                    {incidencia.id} · {incidencia.estado} · {incidencia.aula}
                  </Link>
                ))}
              </div>

              {errores.duplicado && (
                <p className="mt-3 text-sm font-semibold text-red-300">
                  {errores.duplicado}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setPermitirDuplicado(true)
                  setErrores({ ...errores, duplicado: '' })
                }}
                className="theme-secondary mt-4 rounded-xl border px-4 py-2 text-sm font-bold"
              >
                Entiendo, registrar de todos modos
              </button>
            </div>
          )}

          <div className="lg:col-span-2">
            <button className="theme-primary w-full rounded-xl px-6 py-3 font-bold transition sm:w-auto">
              {permitirDuplicado ? 'Registrar de todos modos' : 'Registrar incidencia'}
            </button>
          </div>
        </form>

        <aside className="theme-card rounded-2xl border p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3">
              <div className="theme-primary flex h-11 w-11 items-center justify-center rounded-xl">
                <MapPin size={23} />
              </div>

              <div>
                <h2 className="font-bold">Mapa de ubicación</h2>
                <p className="theme-muted text-sm">
                  Referencia visual del Instituto Tecnológico de Toluca.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMapaAbierto(true)}
              className="theme-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition"
            >
              <Maximize2 size={17} />
              Ampliar mapa
            </button>
          </div>

          <div className="theme-panel mt-5 flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border p-3 lg:min-h-[420px]">
            <img
              src={mapaITT}
              alt="Mapa de ubicación del Instituto Tecnológico de Toluca"
              className="max-h-[560px] w-full object-contain"
            />
          </div>

          <div className="theme-panel mt-4 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="theme-soft-text">
              Usa el mapa como apoyo para identificar el edificio, aula,
              laboratorio o área donde se presenta la incidencia.
            </p>
            <p className="theme-accent-text mt-3 font-semibold">{EDIFICIO_T}</p>
          </div>
        </aside>
      </section>

      {mapaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="theme-card flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Mapa completo del ITT</h2>
                <p className="theme-muted text-sm">{EDIFICIO_T}</p>
              </div>

              <button
                type="button"
                onClick={() => setMapaAbierto(false)}
                className="theme-primary flex h-10 w-10 items-center justify-center rounded-xl transition"
                aria-label="Cerrar mapa ampliado"
              >
                <X size={20} />
              </button>
            </div>

            <div className="theme-panel mt-4 flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border p-3">
              <img
                src={mapaITT}
                alt="Mapa completo del Instituto Tecnológico de Toluca"
                className="max-h-[78vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CampoSelect({ label, name, value, onChange, error, placeholder, opciones }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="theme-input mt-2 w-full rounded-xl border px-4 py-3 outline-none transition"
      >
        <option value="">{placeholder}</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}
