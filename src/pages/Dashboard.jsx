import { AlertCircle, CheckCircle2, Clock, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [incidencias, setIncidencias] = useState([])

  useEffect(() => {
    const datos = JSON.parse(localStorage.getItem('incidenciasITT')) || []
    setIncidencias(datos)
  }, [])

  const propias =
    usuario?.rol === 'Administrador'
      ? incidencias
      : usuario?.rol === 'Técnico'
        ? incidencias.filter((i) => i.tecnicoAsignado === usuario.nombre)
        : incidencias.filter((i) => i.reportadoPor === usuario?.correo)

  const total = propias.length
  const pendientes = propias.filter((i) => i.estado === 'Pendiente').length
  const proceso = propias.filter((i) => i.estado === 'En proceso').length
  const resueltas = propias.filter((i) => i.estado === 'Resuelto').length

  const tarjetas = [
    {
      titulo: 'Total de incidencias',
      valor: total,
      icono: ClipboardList,
      clase: 'bg-blue-500',
    },
    {
      titulo: 'Pendientes',
      valor: pendientes,
      icono: Clock,
      clase: 'bg-orange-500',
    },
    {
      titulo: 'En proceso',
      valor: proceso,
      icono: AlertCircle,
      clase: 'bg-purple-500',
    },
    {
      titulo: 'Resueltas',
      valor: resueltas,
      icono: CheckCircle2,
      clase: 'bg-emerald-500',
    },
  ]

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Panel principal
      </p>

      <h1 className="mt-2 text-3xl font-bold text-white">
        Bienvenido, {usuario?.nombre}
      </h1>

      <p className="mt-2 text-slate-400">
        Rol activo: {usuario?.rol}. Desde aquí puedes consultar el estado
        general de las incidencias.
      </p>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono

          return (
            <article
              key={tarjeta.titulo}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${tarjeta.clase} text-white`}
              >
                <Icono size={24} />
              </div>

              <p className="mt-5 text-sm text-slate-400">{tarjeta.titulo}</p>

              <p className="mt-1 text-4xl font-bold text-white">
                {tarjeta.valor}
              </p>
            </article>
          )
        })}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">
          Descripción del prototipo
        </h2>

        <p className="mt-3 leading-relaxed text-slate-300">
          Este prototipo permite simular el registro, consulta, asignación y
          seguimiento de incidencias en infraestructura del Instituto Tecnológico
          de Toluca. Los datos se guardan temporalmente en el navegador mediante
          localStorage.
        </p>
      </section>
    </div>
  )
}