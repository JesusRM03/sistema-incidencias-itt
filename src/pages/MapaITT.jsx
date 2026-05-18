import { MapPin, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import mapaITT from '../assets/mapa-itt.jpg'
import { EDIFICIO_T } from '../utils/storage'

export default function MapaITT() {
  const [mapaAbierto, setMapaAbierto] = useState(false)

  return (
    <div>
      <p className="theme-kicker text-sm font-semibold">Consulta institucional</p>
      <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold">Mapa del Instituto</h1>
          <p className="theme-muted mt-2 max-w-3xl">
            Consulta la ubicación de edificios y áreas del Instituto Tecnológico
            de Toluca. Esta vista es solo de referencia y está disponible para
            todos los roles del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMapaAbierto(true)}
          className="theme-primary inline-flex w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition"
        >
          <Maximize2 size={18} />
          Ampliar mapa
        </button>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="theme-card rounded-2xl border p-5">
          <div className="theme-panel flex min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border p-3">
            <img
              src={mapaITT}
              alt="Mapa de ubicación del Instituto Tecnológico de Toluca"
              className="max-h-[720px] w-full object-contain"
            />
          </div>
        </article>

        <aside className="theme-card h-fit rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="theme-primary flex h-11 w-11 items-center justify-center rounded-xl">
              <MapPin size={23} />
            </div>
            <div>
              <h2 className="font-bold">Referencia rápida</h2>
              <p className="theme-muted text-sm">Mapa institucional ITT</p>
            </div>
          </div>

          <div className="theme-panel mt-5 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="theme-soft-text">
              Administradores y técnicos pueden usar esta vista para ubicar
              reportes antes de asignar, revisar o cerrar una incidencia.
            </p>
            <p className="theme-accent-text mt-4 font-semibold">{EDIFICIO_T}</p>
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
