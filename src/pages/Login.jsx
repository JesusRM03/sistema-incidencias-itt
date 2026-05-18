import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoITT from '../assets/logo-itt.png'
import { useAuth } from '../context/AuthContext'

const usuariosDemo = [
  'admin@ittoluca.edu.mx / admin123',
  'tecnico@ittoluca.edu.mx / tecnico123',
  'alumno@ittoluca.edu.mx / alumno123',
  'docente@ittoluca.edu.mx / docente123',
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [correo, setCorreo] = useState('admin@ittoluca.edu.mx')
  const [password, setPassword] = useState('admin123')
  const [mensaje, setMensaje] = useState('')

  const enviar = (e) => {
    e.preventDefault()

    const resultado = login(correo, password)

    if (!resultado.ok) {
      setMensaje(resultado.mensaje)
      return
    }

    navigate('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white sm:p-6">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-gradient-to-br from-emerald-500 via-sky-600 to-blue-800 p-8 text-white sm:p-10">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
              <img
                src={logoITT}
                alt="Logo Instituto Tecnológico de Toluca"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest">
                Instituto Tecnológico de Toluca
              </p>
              <p className="mt-1 text-sm text-white/85">
                Ingeniería en Sistemas Computacionales
              </p>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight">
            Sistema Integral de Reporte y Seguimiento de Incidencias
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-white/85">
            Prototipo académico para registrar, consultar, asignar y dar
            seguimiento a incidencias de infraestructura institucional.
          </p>

          <div className="mt-8 rounded-2xl border border-white/20 bg-slate-950/20 p-5 text-sm backdrop-blur">
            <p className="mb-3 font-semibold">Usuarios de prueba</p>
            <div className="grid gap-2">
              {usuariosDemo.map((usuario) => (
                <p key={usuario} className="rounded-lg bg-white/10 px-3 py-2">
                  {usuario}
                </p>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={enviar} className="p-8 sm:p-10">
          <p className="text-sm font-semibold text-emerald-400">
            Acceso al sistema
          </p>

          <h2 className="mt-2 text-3xl font-bold">Iniciar sesión</h2>

          <p className="mt-2 text-slate-400">
            Accede con un correo institucional registrado en el prototipo.
          </p>

          <label className="mt-8 block text-sm font-medium">
            Correo institucional
          </label>

          <input
            type="text"
            inputMode="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            required
          />

          <label className="mt-5 block text-sm font-medium">Contraseña</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
            required
          />

          {mensaje && (
            <div className="mt-5 rounded-xl border border-red-800 bg-red-950 p-3 text-sm text-red-200">
              {mensaje}
            </div>
          )}

          <button className="mt-7 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
            Entrar al sistema
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-emerald-400">
              Registrarse
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
            <p className="font-semibold text-white">Versión del sistema</p>
            <p className="mt-1">
              Prototipo académico con almacenamiento local del navegador.
            </p>
          </div>
        </form>
      </section>
    </main>
  )
}
