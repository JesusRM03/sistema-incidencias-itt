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
import { useTheme } from '../context/ThemeContext'
import {
  clasesEstado,
  contarPorCampo,
  convertirConteoGrafica,
  getIncidencias,
  ordenarPorFechaDesc,
} from '../utils/storage'

export default function Reportes() {
  const { theme } = useTheme()
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
      estilo: { backgroundColor: 'var(--secondary)', color: 'var(--button-text)' },
    },
    {
      titulo: 'Pendientes',
      valor: resumen.pendientes,
      icono: Clock,
      estilo: { backgroundColor: 'var(--warning)', color: 'var(--button-text)' },
    },
    {
      titulo: 'En proceso',
      valor: resumen.proceso,
      icono: AlertTriangle,
      estilo: { backgroundColor: 'var(--accent)', color: 'var(--button-text)' },
    },
    {
      titulo: 'Resueltas',
      valor: resumen.resueltas,
      icono: CheckCircle2,
      estilo: { backgroundColor: 'var(--accent-strong)', color: 'var(--button-text)' },
    },
    {
      titulo: 'Canceladas',
      valor: resumen.canceladas,
      icono: XCircle,
      estilo: { backgroundColor: 'var(--danger)', color: '#ffffff' },
    },
  ]

  return (
    <div>
      <p className="theme-kicker text-sm font-semibold">Reportes estadísticos</p>
      <div className="mt-2 flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="theme-muted mt-2 max-w-3xl">
            Vista administrativa para analizar incidencias por estado, tipo de
            falla, edificio o área y prioridad.
          </p>
        </div>
        <span className="theme-subtle w-fit rounded-full border px-3 py-1 text-xs font-bold">
          Tema: {theme.nombre}
        </span>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono

          return (
            <article key={tarjeta.titulo} className="theme-card rounded-2xl border p-5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={tarjeta.estilo}
              >
                <Icono size={22} />
              </div>
              <p className="theme-muted mt-4 text-sm">{tarjeta.titulo}</p>
              <p className="mt-1 text-3xl font-bold">{tarjeta.valor}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Grafica
          titulo="Incidencias por estado"
          datos={datos.porEstado}
          color={theme.chart.estado}
          chart={theme.chart}
        />
        <Grafica
          titulo="Incidencias por tipo de falla"
          datos={datos.porTipo}
          color={theme.chart.tipo}
          chart={theme.chart}
        />
        <Grafica
          titulo="Incidencias por edificio o área"
          datos={datos.porEdificio}
          color={theme.chart.edificio}
          chart={theme.chart}
        />
        <Grafica
          titulo="Incidencias por prioridad"
          datos={datos.porPrioridad}
          color={theme.chart.prioridad}
          chart={theme.chart}
        />
      </section>

      <section className="theme-card mt-8 rounded-2xl border p-6">
        <h2 className="text-xl font-bold">Incidencias recientes</h2>
        <p className="theme-muted mt-2 text-sm">
          Últimos registros ordenados por fecha para revisión rápida.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="py-3 pr-4">ID</th>
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Ubicación</th>
                <th className="py-3 pr-4">Prioridad</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {datos.recientes.map((incidencia) => (
                <tr key={incidencia.id} className="theme-soft-text">
                  <td className="py-4 pr-4 font-semibold">{incidencia.id}</td>
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

function Grafica({ titulo, datos, color, chart }) {
  return (
    <article className="theme-card rounded-2xl border p-6">
      <h2 className="text-xl font-bold">{titulo}</h2>

      {datos.length === 0 ? (
        <p className="theme-muted mt-5">No hay datos disponibles.</p>
      ) : (
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
              <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="nombre"
                tick={{ fill: chart.text, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: chart.axis }}
                interval={0}
                angle={-15}
                textAnchor="end"
                tickFormatter={(value) =>
                  value.length > 18 ? `${value.slice(0, 18)}...` : value
                }
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: chart.text, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: chart.axis }}
              />
              <Tooltip
                cursor={{ fill: chart.cursor }}
                contentStyle={{
                  background: chart.tooltipBg,
                  border: `1px solid ${chart.tooltipBorder}`,
                  borderRadius: '12px',
                  color: chart.text,
                }}
                labelStyle={{ color: chart.text }}
              />
              <Bar dataKey="total" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
