import { RotateCcw, ShieldCheck, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  contarPorCampo,
  getIncidencias,
  getUsuarios,
  limpiarIncidenciasDemo,
  reiniciarDatosDemo,
  ROLES,
} from '../utils/storage'

export default function Administracion() {
  const [usuarios, setUsuarios] = useState(() => getUsuarios())
  const [incidencias, setIncidencias] = useState(() => getIncidencias())
  const [mensaje, setMensaje] = useState('')

  const cargar = useCallback(() => {
    setUsuarios(getUsuarios())
    setIncidencias(getIncidencias())
  }, [])

  useEffect(() => {
    window.addEventListener('itt-storage-updated', cargar)
    return () => window.removeEventListener('itt-storage-updated', cargar)
  }, [cargar])

  const usuariosPorRol = useMemo(() => contarPorCampo(usuarios, 'rol'), [usuarios])

  const limpiarDatos = () => {
    const confirmado = window.confirm(
      '¿Deseas limpiar las incidencias y notificaciones de prueba? Esta acción no elimina usuarios.',
    )

    if (!confirmado) return

    limpiarIncidenciasDemo()
    cargar()
    setMensaje('Incidencias y notificaciones de prueba eliminadas.')
  }

  const reiniciarDemo = () => {
    const confirmado = window.confirm(
      '¿Deseas reiniciar usuarios, incidencias y notificaciones demo? Se reemplazarán los datos locales actuales.',
    )

    if (!confirmado) return

    reiniciarDatosDemo()
    cargar()
    setMensaje('Datos demo reiniciados correctamente.')
  }

  return (
    <div>
      <p className="text-sm font-semibold text-emerald-400">
        Configuración administrativa
      </p>

      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Administración</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Consulta usuarios registrados y administra los datos de prueba del
            prototipo académico.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={limpiarDatos}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderColor: 'rgba(220, 38, 38, 0.42)',
              color: 'var(--danger)',
            }}
          >
            <Trash2 size={18} />
            Limpiar incidencias
          </button>

          <button
            onClick={reiniciarDemo}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <RotateCcw size={18} />
            Reiniciar datos demo
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
          {mensaje}
        </div>
      )}

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <ResumenCard
          titulo="Usuarios registrados"
          valor={usuarios.length}
          icono={Users}
          clase="bg-sky-400 text-slate-950"
        />
        {Object.values(ROLES).map((rol) => (
          <ResumenCard
            key={rol}
            titulo={rol}
            valor={usuariosPorRol[rol] || 0}
            icono={ShieldCheck}
            clase="bg-emerald-500 text-slate-950"
          />
        ))}
      </section>

      <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-bold text-white">Usuarios registrados</h2>
          <p className="mt-2 text-sm text-slate-400">
            Listado consultivo de usuarios guardados en localStorage.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Nombre</th>
                  <th className="py-3 pr-4">Correo</th>
                  <th className="py-3 pr-4">Rol</th>
                  <th className="py-3 pr-4">Identificador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usuarios.map((usuario) => (
                  <tr key={usuario.correo} className="text-slate-300">
                    <td className="py-4 pr-4 font-semibold text-white">
                      {usuario.nombre}
                    </td>
                    <td className="py-4 pr-4">{usuario.correo}</td>
                    <td className="py-4 pr-4">{usuario.rol}</td>
                    <td className="py-4 pr-4">{usuario.identificador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-bold text-white">Datos locales</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            El prototipo no usa backend ni base de datos real. Las acciones de
            esta sección afectan únicamente el almacenamiento local del navegador.
          </p>

          <dl className="mt-6 grid gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-sm text-slate-500">Incidencias actuales</dt>
              <dd className="mt-1 text-3xl font-bold text-white">
                {incidencias.length}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-sm text-slate-500">Persistencia</dt>
              <dd className="mt-1 text-lg font-bold text-emerald-300">
                localStorage
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  )
}

function ResumenCard({ titulo, valor, icono: Icono, clase }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${clase}`}>
        <Icono size={22} />
      </div>
      <p className="mt-4 text-sm text-slate-400">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-white">{valor}</p>
    </article>
  )
}
