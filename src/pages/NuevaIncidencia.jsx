import { CheckCircle2, FileText, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mapaITT from '../assets/mapa-itt.jpg'
import { useAuth } from '../context/AuthContext'
import {
  crearNotificaciones,
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

  const cambiar = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    })
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
      <p className="text-sm font-semibold text-emerald-400">
        Registro de incidencia
      </p>

      <h1 className="mt-2 text-3xl font-bold text-white">Nueva incidencia</h1>

      <p className="mt-2 max-w-3xl text-slate-400">
        Captura la falla con ubicación clara, prioridad y una descripción breve
        pero suficiente para que mantenimiento pueda atenderla.
      </p>

      {mensajeExito && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
          <CheckCircle2 size={20} />
          {mensajeExito}
        </div>
      )}

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <form
          onSubmit={guardar}
          className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30 sm:p-6 lg:grid-cols-2"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Aula, laboratorio o punto específico
            </label>

            <input
              name="aula"
              value={formulario.aula}
              onChange={cambiar}
              placeholder="Ej. Aula F-12, Laboratorio B1-03"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            {errores.aula && (
              <p className="mt-2 text-sm text-red-300">{errores.aula}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Evidencia simulada
            </label>

            <div className="mt-2 flex rounded-xl border border-slate-700 bg-slate-950 focus-within:border-emerald-400">
              <span className="flex items-center px-4 text-slate-500">
                <FileText size={18} />
              </span>
              <input
                name="evidencia"
                value={formulario.evidencia}
                onChange={cambiar}
                placeholder="Ej. Foto tomada, nota de evidencia..."
                className="min-w-0 flex-1 rounded-xl bg-transparent py-3 pr-4 text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              No se sube archivo real; solo se registra una nota o nombre.
            </p>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-white">
              Descripción de la incidencia
            </label>

            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={cambiar}
              rows="5"
              placeholder="Describe con claridad qué falla, desde cuándo y si afecta una clase o servicio."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
            />

            {errores.descripcion && (
              <p className="mt-2 text-sm text-red-300">{errores.descripcion}</p>
            )}
          </div>

          <div className="lg:col-span-2">
            <button className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 sm:w-auto">
              Registrar incidencia
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <MapPin size={23} />
            </div>

            <div>
              <h2 className="font-bold text-white">Mapa de ubicación</h2>
              <p className="text-sm text-slate-400">
                Referencia visual del Instituto Tecnológico de Toluca.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <img
              src={mapaITT}
              alt="Mapa de ubicación del Instituto Tecnológico de Toluca"
              className="max-h-[580px] w-full object-cover"
            />
          </div>

          <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
            Usa el mapa como apoyo para identificar edificio, aula, laboratorio
            o área. El punto específico del formulario ayuda a que la atención
            no dependa solo del nombre del edificio.
          </p>
        </aside>
      </section>
    </div>
  )
}

function CampoSelect({ label, name, value, onChange, error, placeholder, opciones }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
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
