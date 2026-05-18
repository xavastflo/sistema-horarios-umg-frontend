import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, getMe, cambiarPerfil as apiCambiarPerfil } from '../api/auth'

/**
 * AuthContext
 *
 * Estado global de autenticación. Expone:
 *   usuario         — objeto completo del backend ({ id_usuario, nombres, ... })
 *   token           — string Bearer
 *   perfilActivo    — string con el rol activo ('administrador', 'coordinador', ...)
 *   roles           — array de roles disponibles del usuario
 *   cargando        — true mientras se verifica el token en localStorage
 *   error           — mensaje de error del último intento de login
 *
 * Reglas:
 *   - Lee response.data.token y response.data.usuario de /auth/login
 *   - Lee usuario.perfil_activo; si viene null usa roles[0].nombre_rol como fallback
 *   - Persiste token y usuario en localStorage
 *   - Escucha evento 'auth:logout' del interceptor Axios para limpiar sesión
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario,      setUsuario]      = useState(null)
  const [token,        setToken]        = useState(() => localStorage.getItem('token'))
  const [perfilActivo, setPerfilActivo] = useState(null)
  const [roles,        setRoles]        = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState(null)

  // ── Helper: resolver perfil activo con fallback ────────────────
  const resolverPerfil = (usuarioData) => {
    if (usuarioData?.perfil_activo) return usuarioData.perfil_activo
    if (usuarioData?.roles?.length) return usuarioData.roles[0].nombre_rol
    return null
  }

  // ── Helper: hidratar estado desde objeto usuario ──────────────
  const hidratarDesdeUsuario = useCallback((usuarioData, tokenValue) => {
    setUsuario(usuarioData)
    setRoles(usuarioData?.roles ?? [])
    setPerfilActivo(resolverPerfil(usuarioData))
    if (tokenValue) {
      setToken(tokenValue)
      localStorage.setItem('token', tokenValue)
      localStorage.setItem('usuario', JSON.stringify(usuarioData))
    }
  }, [])

  // ── Rehidratación al montar: verificar token existente ────────
  useEffect(() => {
    async function verificar() {
      const tokenGuardado = localStorage.getItem('token')
      if (!tokenGuardado) {
        setCargando(false)
        return
      }
      try {
        // GET /auth/me para confirmar que el token sigue válido
        const data = await getMe()
        // La respuesta de /auth/me puede devolver { usuario: {...} } o el usuario directamente
        const usuarioData = data.usuario ?? data
        hidratarDesdeUsuario(usuarioData, tokenGuardado)
      } catch {
        // Token inválido o expirado — limpiar
        limpiarSesion()
      } finally {
        setCargando(false)
      }
    }
    verificar()
  }, [hidratarDesdeUsuario])

  // ── Escuchar evento global de logout (del interceptor Axios) ──
  useEffect(() => {
    const handler = () => limpiarSesion()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  // ── Acciones ──────────────────────────────────────────────────

  async function iniciarSesion(nombreUsuario, password) {
    setError(null)
    try {
      const data = await apiLogin(nombreUsuario, password)
      // Estructura aprobada: { token, tipo_token, usuario: { perfil_activo, roles, ... } }
      hidratarDesdeUsuario(data.usuario, data.token)
      return { ok: true, perfilActivo: resolverPerfil(data.usuario) }
    } catch (err) {
      const mensaje = err.response?.data?.message ?? 'Error al iniciar sesión.'
      setError(mensaje)
      return { ok: false, error: mensaje }
    }
  }

  async function cerrarSesion() {
    try {
      await apiLogout()
    } catch {
      // Si falla el logout en el backend (token ya inválido), igual limpiamos localmente
    }
    limpiarSesion()
  }

  async function cambiarPerfil(nombreRol) {
    try {
      const data = await apiCambiarPerfil(nombreRol)
      // Respuesta: { message, usuario: { perfil_activo, roles } }
      const usuarioActualizado = data.usuario ?? {}

      // Fusionar usuario guardado con los campos actualizados del backend
      // setUsuario recibe el objeto completo para no perder campos como
      // id_usuario, nombres, apellidos, etc. que /cambiar-perfil no devuelve.
      const usuarioFusionado = { ...(usuario ?? {}), ...usuarioActualizado }

      setUsuario(usuarioFusionado)
      setPerfilActivo(resolverPerfil(usuarioFusionado))
      setRoles(usuarioFusionado.roles ?? roles)

      // Persistir el objeto fusionado en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuarioFusionado))

      return { ok: true }
    } catch (err) {
      const mensaje = err.response?.data?.message ?? 'Error al cambiar perfil.'
      return { ok: false, error: mensaje }
    }
  }

  function limpiarSesion() {
    setUsuario(null)
    setToken(null)
    setPerfilActivo(null)
    setRoles([])
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  // ── Utilidades de consulta ────────────────────────────────────
  const tieneRol = (nombreRol) => roles.some(r => r.nombre_rol === nombreRol)
  const esAdmin  = () => tieneRol('administrador')
  const tieneMultiplesRoles = () => roles.length > 1

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      perfilActivo,
      roles,
      cargando,
      error,
      iniciarSesion,
      cerrarSesion,
      cambiarPerfil,
      limpiarSesion,
      tieneRol,
      esAdmin,
      tieneMultiplesRoles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
