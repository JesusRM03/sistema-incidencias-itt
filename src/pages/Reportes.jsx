import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function Reportes() {
  const [incidencias, setIncidencias] = useState([])

  useEffect(() => {
    const datos = JSON.parse(localStorage.getItem('incidenciasITT')) || []
    setIncidencias(datos)
  }, [])

  const contarPorCampo = (campo) => {
    const conteo = {}

    incidencias.forEach((incidencia) => {
      const valor = incidencia[campo] || 'Sin dato'
      conteo[valor] = (conteo[valor] || 0) + 1
    })

    return Object.entries(conteo).map(([nombre, total]) => ({
      nombre,
      total,
    }))
  }

  const porEstado = contarPorCampo('estado')
  const porTipo = contarPorCampo('tipo')
  const porEdificio = contarPorCampo('edificio')

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Reportes estadísticos
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Reportes</h1>
      <p className="mt-2 text-slate-400">
        Visualización básica de incidencias por estado, tipo de falla y
        ubicación.
      </p>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Grafica titulo="Incidencias por estado" datos={porEstado} />
        <Grafica titulo="Incidencias por tipo de falla" datos={porTipo} />
        <Grafica titulo="Incidencias por edificio" datos={porEdificio} />
      </section>
    </div>
  )
}

function Grafica({ titulo, datos }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-bold text-white">{titulo}</h2>

      {datos.length === 0 ? (
        <p className="mt-5 text-slate-400">No hay datos disponibles.</p>
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}