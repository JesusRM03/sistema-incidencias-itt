import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mapaITT from '../assets/mapa-itt.jpg'
import { useAuth } from '../context/AuthContext'

export default function NuevaIncidencia() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [formulario, setFormulario] = useState({
    tipo: 'Proyector',
    edificio: 'A',
    aula: '',
    descripcion: '',
    prioridad: 'Media',
  })

  const cambiar = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    })
  }

  const guardar = (e) => {
    e.preventDefault()

    const incidencias = JSON.parse(localStorage.getItem('incidenciasITT')) || []

    const nueva = {
      id: `INC-${Date.now()}`,
      ...formulario,
      estado: 'Pendiente',
      fecha: new Date().toLocaleString('es-MX'),
      reportadoPor: usuario.correo,
      nombreReportante: usuario.nombre,
      tecnicoAsignado: '',
      historial: [
        {
          estado: 'Pendiente',
          comentario: 'Incidencia registrada por el usuario.',
          fecha: new Date().toLocaleString('es-MX'),
          responsable: usuario.nombre,
        },
      ],
    }

    localStorage.setItem(
      'incidenciasITT',
      JSON.stringify([nueva, ...incidencias])
    )

    navigate('/mis-incidencias')
  }

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Registro de incidencia
      </p>

      <h1 className="mt-2 text-3xl font-bold text-white">Nueva incidencia</h1>

      <p className="mt-2 text-slate-400">
        Captura la información principal de la falla encontrada en la
        infraestructura del Instituto Tecnológico de Toluca.
      </p>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={guardar}
          className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:grid-cols-2"
        >
          <div>
            <label className="block text-sm font-medium text-white">
              Tipo de falla
            </label>

            <select
              name="tipo"
              value={formulario.tipo}
              onChange={cambiar}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option>Proyector</option>
              <option>Mobiliario</option>
              <option>Instalación eléctrica</option>
              <option>Sanitarios</option>
              <option>Aula o laboratorio</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Prioridad
            </label>

            <select
              name="prioridad"
              value={formulario.prioridad}
              onChange={cambiar}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option>Baja</option>
              <option>Media</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Edificio o área
            </label>

            <select
              name="edificio"
              value={formulario.edificio}
              onChange={cambiar}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option>A - Edificio administrativo</option>
              <option>A1 - Sanitarios alumnos</option>
              <option>B - Centro de información</option>
              <option>B1 - Centro de cómputo</option>
              <option>B2 - Aulas de ingeniería industrial</option>
              <option>B3 - Posgrado e investigación</option>
              <option>B4 - Laboratorio de ingeniería ambiental</option>
              <option>B5 - Laboratorio de ingeniería ambiental</option>
              <option>C - Unidad de apoyo tutorial</option>
              <option>C1 - Centro académico y orientación educativa</option>
              <option>C2 - División de estudios profesionales</option>
              <option>C3 - Centro de enseñanza de lenguas extranjeras</option>
              <option>D - Jefatura y cubículos de ingeniería química</option>
              <option>D1 - Jefatura y laboratorio de ingeniería electrónica</option>
              <option>D3 - Ingeniería mecatrónica</option>
              <option>E - Estacionamiento</option>
              <option>F - Aulas de sistemas computacionales</option>
              <option>G - Sindicato</option>
              <option>H - Cafetería</option>
              <option>K - Gestión tecnológica y vinculación</option>
              <option>T - Laboratorio de redes, gimnasio, auditorio y alberca</option>
              <option>G1 - Gradas, vestidores y actividades extraescolares</option>
              <option>G2 - Actividades extraescolares</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">
              Aula, laboratorio o punto específico
            </label>

            <input
              name="aula"
              value={formulario.aula}
              onChange={cambiar}
              placeholder="Ej. Aula B-2, Laboratorio C-1, Sanitarios..."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              required
            />
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
              placeholder="Describe con claridad la falla encontrada..."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <button className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
              Registrar incidencia
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
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
              className="h-full w-full object-cover"
            />
          </div>

          <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
            Usa el mapa como apoyo para identificar el edificio, aula,
            laboratorio o área donde se presenta la incidencia. Después
            selecciona la ubicación en el formulario y escribe el punto exacto.
          </p>
        </aside>
      </section>
    </div>
  )
}