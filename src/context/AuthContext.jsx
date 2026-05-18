import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

const usuariosIniciales = [
  {
    id: 1,
    nombre: 'Administrador ITT',
    correo: 'admin@ittoluca.edu.mx',
    password: 'admin123',
    rol: 'Administrador',
    identificador: 'ADM001',
  },
  {
    id: 2,
    nombre: 'Técnico de Mantenimiento',
    correo: 'tecnico@ittoluca.edu.mx',
    password: 'tecnico123',
    rol: 'Técnico',
    identificador: 'TEC001',
  },
  {
    id: 3,
    nombre: 'Alumno Demo',
    correo: 'alumno@ittoluca.edu.mx',
    password: 'alumno123',
    rol: 'Alumno',
    identificador: '23280182',
  },
]

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const usuariosGuardados = localStorage.getItem('usuariosITT')
    const usuarioActual = localStorage.getItem('usuarioActualITT')

    if (!usuariosGuardados) {
      localStorage.setItem('usuariosITT', JSON.stringify(usuariosIniciales))
    }

    if (usuarioActual) {
      setUsuario(JSON.parse(usuarioActual))
    }
  }, [])

  const login = (correo, password) => {
    const usuarios = JSON.parse(localStorage.getItem('usuariosITT')) || []

    const encontrado = usuarios.find(
      (u) => u.correo === correo && u.password === password
    )

    if (!encontrado) {
      return {
        ok: false,
        mensaje: 'Correo o contraseña incorrectos.',
      }
    }

    setUsuario(encontrado)
    localStorage.setItem('usuarioActualITT', JSON.stringify(encontrado))

    return {
      ok: true,
      mensaje: 'Inicio de sesión correcto.',
    }
  }

  const registrar = (nuevoUsuario) => {
    const usuarios = JSON.parse(localStorage.getItem('usuariosITT')) || []

    const existe = usuarios.some((u) => u.correo === nuevoUsuario.correo)

    if (existe) {
      return {
        ok: false,
        mensaje: 'Ya existe un usuario registrado con ese correo.',
      }
    }

    const usuarioCreado = {
      id: Date.now(),
      ...nuevoUsuario,
    }

    const actualizados = [...usuarios, usuarioCreado]
    localStorage.setItem('usuariosITT', JSON.stringify(actualizados))

    return {
      ok: true,
      mensaje: 'Usuario registrado correctamente.',
    }
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('usuarioActualITT')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}