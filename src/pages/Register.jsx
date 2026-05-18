import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/storage'

export default function Register() {
  const navigate = useNavigate()
  const { registrar } = useAuth()

  const [formulario, setFormulario] = useState({
    nombre: '',
    correo: '',
    identificador: '',
    rol: ROLES.ALUMNO,
    password: '',
  })

  const [mensaje, setMensaje] = useState('')
  const [ok, setOk] = useState(false)

  const cambiar = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    })
  }

  const enviar = (e) => {
    e.preventDefault()

    const resultado = registrar(formulario)
    setMensaje(resultado.mensaje)
    setOk(resultado.ok)

    if (resultado.ok) {
      setTimeout(() => {
        navigate('/login')
      }, 900)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white sm:p-6">
      <form
        onSubmit={enviar}
        className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
      >
        <p className="text-sm font-semibold text-emerald-400">
          Registro de usuario
        </p>
        <h1 className="mt-2 text-3xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-slate-400">
          Alta simulada de usuarios para probar permisos por rol dentro del
          prototipo.
        </p>

        <label className="mt-6 block text-sm font-medium">Nombre completo</label>
        <input
          name="nombre"
          value={formulario.nombre}
          onChange={cambiar}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
          required
        />

        <label className="mt-4 block text-sm font-medium">
          Correo institucional
        </label>
        <input
          type="email"
          name="correo"
          value={formulario.correo}
          onChange={cambiar}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
          required
        />

        <label className="mt-4 block text-sm font-medium">
          Número de control o nómina
        </label>
        <input
          name="identificador"
          value={formulario.identificador}
          onChange={cambiar}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
          required
        />

        <label className="mt-4 block text-sm font-medium">Rol</label>
        <select
          name="rol"
          value={formulario.rol}
          onChange={cambiar}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
        >
          {Object.values(ROLES).map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium">Contraseña</label>
        <input
          type="password"
          name="password"
          value={formulario.password}
          onChange={cambiar}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
          required
        />

        {mensaje && (
          <div
            className={`mt-5 rounded-xl border p-3 text-sm ${
              ok
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                : 'border-red-400/30 bg-red-400/10 text-red-100'
            }`}
          >
            {mensaje}
          </div>
        )}

        <button className="mt-7 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400">
          Registrar usuario
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-emerald-400">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  )
}
