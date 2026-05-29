import api from './axios'

/**
 * Módulo de API — Docentes.
 * Rol permitido: administrador + coordinador.
 *
 * Endpoints consumidos:
 *   GET    /docentes                     lista ordenada por prioridad ASC
 *   POST   /docentes                     crear perfil docente desde usuario existente
 *   PUT    /docentes/{id}                actualizar código, prioridad o estado
 *   DELETE /docentes/{id}                desactivar (estado → inactivo)
 *   PATCH  /docentes/{id}/prioridad      cambio rápido de prioridad
 *
 * Catálogo auxiliar (solo para el form de crear):
 *   GET    /usuarios?id_rol=3&sin_docente=1   usuarios con rol docente sin perfil docente aún
 */

/**
 * Lista docentes.
 * @param {{ estado?: string, prioridad?: number, buscar?: string }} params
 */
export async function getDocentes(params = {}) {
  const response = await api.get('/docentes', { params })
  return response.data
}

/**
 * Crea un perfil docente desde un usuario con rol docente.
 * @param {{ id_usuario: number, codigo_docente?: string, prioridad?: number }} datos
 */
export async function crearDocente(datos) {
  const response = await api.post('/docentes', datos)
  return response.data
}

/**
 * Actualiza código, prioridad o estado del docente.
 * @param {number} id
 * @param {{ codigo_docente?: string, prioridad?: number, estado?: string }} datos
 */
export async function actualizarDocente(id, datos) {
  const response = await api.put(`/docentes/${id}`, datos)
  return response.data
}

/**
 * Desactiva un docente (estado → inactivo).
 * @param {number} id
 */
export async function eliminarDocente(id) {
  const response = await api.delete(`/docentes/${id}`)
  return response.data
}

/**
 * Cambia solo la prioridad del docente.
 * @param {number} id
 * @param {1|2|3}  prioridad
 */
export async function cambiarPrioridad(id, prioridad) {
  const response = await api.patch(`/docentes/${id}/prioridad`, { prioridad })
  return response.data // { message, prioridad, etiqueta }
}

/**
 * Lista usuarios con rol docente (id_rol=3) que aún NO tienen perfil docente.
 * sin_docente=1 → backend aplica whereDoesntHave('docente'), excluyendo
 * cualquier id_usuario ya registrado en la tabla docente (activo o inactivo).
 * Solo accesible por administrador — coordinador no puede listar usuarios.
 */
export async function getUsuariosDocentes() {
  const response = await api.get('/usuarios', { params: { id_rol: 3, sin_docente: 1 } })
  return response.data
}

/**
 * Obtiene el perfil docente del usuario autenticado.
 * Usado por DisponibilidadDocente.jsx.
 */
export async function getPerfilDocente() {
  const response = await api.get('/perfil/docente')
  return response.data
}

/**
 * Obtiene el horario del docente autenticado.
 * Endpoint: GET /docente/horario
 */
export async function getMiHorarioDocente() {
  const response = await api.get('/docente/horario')
  return response.data
}
