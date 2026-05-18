import api from './axios'

/**
 * Módulo de API — Usuarios.
 * Rol permitido: solo administrador.
 *
 * Serialización: la relación rolesActivos() se serializa como 'roles_activos' (snake_case).
 *
 * Roles del sistema (fijos por seeder):
 *   1 = administrador, 2 = coordinador, 3 = docente, 4 = estudiante
 *
 * Endpoints consumidos:
 *   GET    /catalogos/roles                 catálogo público de roles
 *   GET    /usuarios                        listar usuarios
 *   POST   /usuarios                        crear usuario
 *   PUT    /usuarios/{id}                   actualizar usuario
 *   DELETE /usuarios/{id}                   desactivar (estado → inactivo)
 *   POST   /usuarios/{id}/roles             asignar rol
 *   DELETE /usuarios/{id}/roles/{id_rol}    quitar rol
 */

/**
 * Catálogo de roles (endpoint público, sin autenticación).
 */
export async function getRoles() {
  const response = await api.get('/catalogos/roles')
  return response.data
}

/**
 * Lista usuarios con filtros opcionales.
 * @param {{ estado?: string, buscar?: string, id_rol?: number }} params
 */
export async function getUsuarios(params = {}) {
  const response = await api.get('/usuarios', { params })
  return response.data
}

/**
 * Crea un usuario.
 * @param {{
 *   nombres: string,
 *   apellidos: string,
 *   nombre_usuario: string,
 *   correo_electronico: string,
 *   password: string,
 *   password_confirmation: string,
 *   pregunta_seguridad: string,
 *   respuesta_seguridad: string,
 *   telefono?: string
 * }} datos
 */
export async function crearUsuario(datos) {
  const response = await api.post('/usuarios', datos)
  return response.data
}

/**
 * Actualiza datos de un usuario.
 * El campo password no existe en PUT (no hay cambio de contraseña en este endpoint).
 * @param {number} id
 * @param {{
 *   nombres?: string, apellidos?: string, nombre_usuario?: string,
 *   correo_electronico?: string, telefono?: string,
 *   estado?: 'activo'|'inactivo'|'bloqueado',
 *   pregunta_seguridad?: string, respuesta_seguridad?: string
 * }} datos
 */
export async function actualizarUsuario(id, datos) {
  const response = await api.put(`/usuarios/${id}`, datos)
  return response.data
}

/**
 * Desactiva un usuario (estado → inactivo).
 * @param {number} id
 */
export async function eliminarUsuario(id) {
  const response = await api.delete(`/usuarios/${id}`)
  return response.data
}

/**
 * Asigna un rol a un usuario. Si ya lo tenía inactivo, lo reactiva.
 * @param {number} idUsuario
 * @param {number} idRol
 */
export async function asignarRol(idUsuario, idRol) {
  const response = await api.post(`/usuarios/${idUsuario}/roles`, { id_rol: idRol })
  return response.data // { message, usuario }
}

/**
 * Quita un rol de un usuario.
 * @param {number} idUsuario
 * @param {number} idRol
 */
export async function quitarRol(idUsuario, idRol) {
  const response = await api.delete(`/usuarios/${idUsuario}/roles/${idRol}`)
  return response.data // { message, usuario }
}
