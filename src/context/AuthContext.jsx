/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import {
  ensureDemoData,
  getUsuarioActualGuardado,
  getUsuarios,
  guardarUsuarioActual,
  guardarUsuarios,
  limpiarUsuarioActual,
  normalizarUsuario,
} from '../utils/storage'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    ensureDemoData()

    const usuarioActual = getUsuarioActualGuardado()
    if (!usuarioActual) return null

    const usuarios = getUsuarios()
    const actualizado = usuarios.find((u) => u.correo === usuarioActual.correo)

    if (actualizado) {
      guardarUsuarioActual(actualizado)
      return actualizado
    }

    guardarUsuarioActual(usuarioActual)
    return usuarioActual
  })

  const login = (correo, password) => {
    const correoNormalizado = correo.trim().toLowerCase()
    const usuarios = getUsuarios()

    const encontrado = usuarios.find(
      (u) => u.correo === correoNormalizado && u.password === password,
    )

    if (!encontrado) {
      return {
        ok: false,
        mensaje: 'Correo o contraseña incorrectos.',
      }
    }

    setUsuario(encontrado)
    guardarUsuarioActual(encontrado)

    return {
      ok: true,
      mensaje: 'Inicio de sesión correcto.',
    }
  }

  const registrar = (nuevoUsuario) => {
    const usuarios = getUsuarios()
    const usuarioNormalizado = normalizarUsuario(nuevoUsuario)

    const existe = usuarios.some((u) => u.correo === usuarioNormalizado.correo)

    if (existe) {
      return {
        ok: false,
        mensaje: 'Ya existe un usuario registrado con ese correo.',
      }
    }

    const usuarioCreado = {
      id: Date.now(),
      ...usuarioNormalizado,
    }

    guardarUsuarios([...usuarios, usuarioCreado])

    return {
      ok: true,
      mensaje: 'Usuario registrado correctamente.',
    }
  }

  const logout = () => {
    setUsuario(null)
    limpiarUsuarioActual()
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
