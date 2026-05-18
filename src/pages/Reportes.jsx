import { AlertTriangle, CheckCircle2, Clock, ClipboardList, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  clasesEstado,
  contarPorCampo,
  convertirConteoGrafica,
  getIncidencias,
  ordenarPorFechaDesc,
} from '../utils/storage'

export default function Reportes() {
  const [incidencias, setIncidencias] = useState(() => getIncidencias())

  useEffect(() => {
    const cargar = () => setIncidencias(getIncidencias())

    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [])

  const resumen = useMemo(
    () => ({
      total: incidencias.length,
      pendientes: incidencias.filter((i) => i.estado === 'Pendiente').length,
      proceso: incidencias.filter((i) => i.estado === 'En proceso').length,
      resueltas: incidencias.filter((i) => i.estado === 'Resuelto').length,
      canceladas: incidencias.filter((i) => i.estado === 'Cancelado').length,
    }),
    [incidencias],
  )

  const datos = useMemo(
    () => ({
      porEstado: convertirConteoGrafica(contarPorCampo(incidencias, 'estado')),
      porTipo: convertirConteoGrafica(contarPorCampo(incidencias, 'tipo')),
      porEdificio: convertirConteoGrafica(contarPorCampo(incidencias, 'edificio')),
      porPrioridad: convertirConteoGrafica(contarPorCampo(incidencias, 'prioridad')),
      recientes: ordenarPorFechaDesc(incidencias).slice(0, 6),
    }),
    [incidencias],
  )

  const tarjetas = [
    {
      titulo: 'Total de incidencias',
      valor: resumen.total,
      icono: ClipboardList,
      clase: 'bg-sky-400 text-slate-950',
    },
    {
      titulo: 'Pendientes',
      valor: resumen.pendientes,
      icono: Clock,
      clase: 'bg-amber-400 text-slate-950',
    },
    {
      titulo: 'En proceso',
      valor: resumen.proceso,
      icono: AlertTriangle,
      clase: 'bg-blue-500 text-white',
    },
    {
      titulo: 'Resueltas',
      valor: resumen.resueltas,
      icono: CheckCircle2,
      clase: 'bg-emerald-500 text-slate-950',
    },
    {
      titulo: 'Canceladas',
      valor: resumen.canceladas,
      icono: XCircle,
      clase: 'bg-red-500 text-white',
    },
  ]

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Reportes estadísticos
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Reportes</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        Vista administrativa para analizar incidencias por estado, tipo de
        falla, edificio o área y prioridad.
      </p>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono

          return (
            <article
              key={tarjeta.titulo}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${tarjeta.clase}`}
              >
                <Icono size={22} />
              </div>
              <p className="mt-4 text-sm text-slate-400">{tarjeta.titulo}</p>
              <p className="mt-1 text-3xl font-bold text-white">{tarjeta.valor}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Grafica titulo="Incidencias por estado" datos={datos.porEstado} color="#10b981" />
        <Grafica titulo="Incidencias por tipo de falla" datos={datos.porTipo} color="#38bdf8" />
        <Grafica
          titulo="Incidencias por edificio o área"
          datos={datos.porEdificio}
          color="#f97316"
        />
        <Grafica
          titulo="Incidencias por prioridad"
          datos={datos.porPrioridad}
          color="#ef4444"
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
        <h2 className="text-xl font-bold text-white">Incidencias recientes</h2>
        <p className="mt-2 text-sm text-slate-400">
          Últimos registros ordenados por fecha para revisión rápida.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 pr-4">ID</th>
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Ubicación</th>
                <th className="py-3 pr-4">Prioridad</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {datos.recientes.map((incidencia) => (
                <tr key={incidencia.id} className="text-slate-300">
                  <td className="py-4 pr-4 font-semibold text-white">{incidencia.id}</td>
                  <td className="py-4 pr-4">{incidencia.tipo}</td>
                  <td className="py-4 pr-4">
                    {incidencia.edificio} · {incidencia.aula}
                  </td>
                  <td className="py-4 pr-4">{incidencia.prioridad}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        clasesEstado[incidencia.estado]
                      }`}
                    >
                      {incidencia.estado}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{incidencia.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Grafica({ titulo, datos, color }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
      <h2 className="text-xl font-bold text-white">{titulo}</h2>

      {datos.length === 0 ? (
        <p className="mt-5 text-slate-400">No hay datos disponibles.</p>
      ) : (
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="nombre"
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                tickFormatter={(value) =>
                  value.length > 18 ? `${value.slice(0, 18)}...` : value
                }
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(15, 23, 42, 0.65)' }}
                contentStyle={{
                  background: '#020617',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="total" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
