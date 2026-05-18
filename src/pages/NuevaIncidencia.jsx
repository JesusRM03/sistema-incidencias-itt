import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

    localStorage.setItem('incidenciasITT', JSON.stringify([nueva, ...incidencias]))
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
        infraestructura.
      </p>

      <form
        onSubmit={guardar}
        className="mt-8 grid gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:grid-cols-2"
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
            Edificio
          </label>
          <select
            name="edificio"
            value={formulario.edificio}
            onChange={cambiar}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
            <option>F</option>
            <option>G</option>
            <option>H</option>
            <option>K</option>
            <option>Centro de cómputo</option>
            <option>Cafetería</option>
            <option>Gimnasio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Aula, laboratorio o área
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
    </div>
  )
}