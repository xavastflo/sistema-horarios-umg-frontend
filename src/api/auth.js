import api from './axios'

/**
 * Módulo de autenticación.
 * Consume únicamente los endpoints aprobados del backend:
 *   POST /auth/login
 *   POST /auth/logout
 *   GET  /auth/me
 *   POST /auth/cambiar-perfil
 */

/**
 * Inicia sesión.
 * @returns {{ token, usuario: { perfil_activo, roles, ... } }}
 */
export async function login(nombreUsuario, password) {
  const response = await api.post('/auth/login', {
    nombre_usuario: nombreUsuario,
    password,
  })
  return response.data
}

/**
 * Cierra sesión en el backend e invalida el token.
 * El limpiado de localStorage lo hace AuthContext.
 */
export async function logout() {
  await api.post('/auth/logout')
}

/**
 * Obtiene el perfil del usuario autenticado.
 * Usado para rehidratar AuthContext al recargar la página.
 * @returns {{ usuario: { perfil_activo, roles, ... } }}
 */
export async function getMe() {
  const response = await api.get('/auth/me')
  return response.data
}

/**
 * Cambia el perfil activo del usuario.
 * El backend espera exactamente: { "nombre_rol": "coordinador" }
 * No enviar id_rol.
 *
 * @param {string} nombreRol — 'administrador' | 'coordinador' | 'docente' | 'estudiante'
 * @returns {{ message, usuario: { perfil_activo, roles } }}
 */
export async function cambiarPerfil(nombreRol) {
  const response = await api.post('/auth/cambiar-perfil', {
    nombre_rol: nombreRol,
  })
  return response.data
}
