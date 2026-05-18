import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-500 to-blue-700 p-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-widest">
            Instituto Tecnológico de Toluca
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight">
            Sistema Integral de Reporte y Seguimiento de Incidencias
          </h1>

          <p className="mt-5 text-white/80">
            Prototipo funcional para registrar, consultar y dar seguimiento a
            incidencias de infraestructura institucional.
          </p>

          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm">
            <p className="font-semibold">Usuarios de prueba:</p>
            <p>admin@ittoluca.edu.mx / admin123</p>
            <p>tecnico@ittoluca.edu.mx / tecnico123</p>
            <p>alumno@ittoluca.edu.mx / alumno123</p>
          </div>
        </div>

        <form onSubmit={enviar} className="p-10">
          <h2 className="text-3xl font-bold">Iniciar sesión</h2>

          <p className="mt-2 text-slate-400">
            Accede con tu correo institucional.
          </p>

          <label className="mt-8 block text-sm font-medium">
            Correo institucional
          </label>

          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
            required
          />

          <label className="mt-5 block text-sm font-medium">Contraseña</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
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
        </form>
      </section>
    </main>
  )
}